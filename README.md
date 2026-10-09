<div align="center">

<img src="frontend/public/favicon.png" width="64" alt="" />

# AI Content Detector

**Paste text or upload a document and see, sentence by sentence, how likely it is to be AI-generated.**

[**Live demo**](https://aicd.vercel.app) · [Benchmarks](https://aicd.vercel.app/benchmarks) · [API docs](https://zubair-elliot-17-aicd-api.hf.space/docs) · [How it works](#how-it-works)

[![CI](https://github.com/Zubair-Elliot-17/AI-CD/actions/workflows/ci.yml/badge.svg)](https://github.com/Zubair-Elliot-17/AI-CD/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

<img src="docs/screenshots/home.png" width="720" alt="AI-CD home page" />

<img src="docs/screenshots/detect.png" width="356" alt="Sentence-level result for a mixed document" /> <img src="docs/screenshots/benchmarks.png" width="356" alt="Benchmarks page" />

</div>

## About

AI-CD started as our final-year **CSC3003S capstone at the University of Cape Town (2025)**, built by team JackBoys:

- **Meekaaeel Booley**
- **Mubashir Dawood**
- **Zubair Elliot**

The original version used a fine-tuned ELECTRA model behind a Flask API on AWS EC2, with a React frontend on AWS Amplify. In 2026 the project was rebuilt:

| | 2025 capstone | 2026 rebuild |
|---|---|---|
| Model | ELECTRA, fine-tuned in [`ModelTrainer/`](ModelTrainer/fine_tuning.ipynb) | RoBERTa-base trained on modern LLM output ([Fakespot](https://huggingface.co/fakespot-ai/roberta-base-ai-text-detection-v1)) |
| API | Flask, SQLite sessions, shared API key | FastAPI, stateless, typed schemas, rate limiting |
| Inference | One model call per sentence | All sentences and passages in one batched pass |
| Frontend | React + JS, MUI, Storybook | React 19 + TypeScript, Tailwind v4, dark mode |
| History | Stored on the server | Stored only in the user's browser |
| Hosting | EC2 + Amplify | Hugging Face Spaces (Docker) + Vercel |
| Quality | Manual testing | Pytest + Vitest, ruff + ESLint, GitHub Actions CI |
| Evaluation | Random split of the training data | Held-out public benchmark, attack tests, calibrated thresholds |

## Results

Both versions were scored on the same **2,474 texts** that neither was trained on: 1,400 from 11 LLMs (GPT-4o, GPT-4, Claude 1.3 to 3 Opus, Llama 3, Gemma 2, Mixtral) and 1,074 human texts from the same domains. Full charts are on the [Benchmarks page](https://aicd.vercel.app/benchmarks), and the raw numbers are in [`backend/eval/results.json`](backend/eval/results.json).

| | 2025 capstone (ELECTRA) | 2026 model, no defence | **2026 rebuild** |
|---|---|---|---|
| AUROC, clean text | 0.902 | 0.923 | **0.923** |
| AI caught when 1% of human text is flagged | 22% | 38% | **38%** |
| AUROC, zero-width-space attack | 0.903 | 0.755 | **0.923** |
| AUROC, look-alike letter attack | 0.835 | 0.596 | **0.923** |
| Human texts flagged as AI | 14% | 10% | **10%** |

Three things came out of building the benchmark:

1. **The new model was easy to fool.** Hiding zero-width spaces in AI text, or swapping half its letters for identical-looking Cyrillic ones, dropped it to near chance (AUROC 0.60). The API now strips invisible characters and maps look-alikes back to Latin before scoring, which restores the clean-text score of 0.923, and it tells the user when it finds them.
2. **The verdict logic was miscalibrated.** The sentence-level "mixed" check called 63% of human writing mixed. Thresholds are now tuned by [`eval/calibrate.py`](backend/eval/calibrate.py) on a separate calibration set from a different data split. On the test set, human texts judged human went from 28% to 74%, and human texts called AI fell from 8.8% to 6.9%. The cost is that more AI text now gets the cautious "mixed" verdict (68% of AI text is called AI, down from 80%).
3. **Persuasive essays are the hardest case.** 39% of the human-written persuasive essays are flagged. They were written by crowdworkers in 2023, when many crowdworkers were already using LLMs, so some of those labels may be wrong. They're reported anyway.

## Features

- **Sentence-level highlights.** Each sentence is shaded by its AI score. Hover one to see its score.
- **Mixed-content detection.** A human essay with a pasted-in AI paragraph is flagged as *mixed* instead of being averaged away (75% of such documents on the benchmark).
- **Evasion detection.** Zero-width characters and Cyrillic/Greek look-alike letters are removed before scoring, and the result says how many were found.
- **File uploads.** PDF, DOCX, TXT and Markdown, parsed in memory.
- **Private.** The API stores nothing. History lives in `localStorage`.
- **Handles cold starts.** The UI polls the API and shows when the free-tier server is waking up.

## How it works

```mermaid
flowchart LR
    A[Text or file] --> B[Extract text<br/>pypdf / python-docx]
    B --> N[Normalise<br/>strip invisible chars,<br/>fix look-alike letters]
    N --> C[Split into sentences<br/>with char offsets]
    C --> D[Sentence windows<br/>sentence ± 1 neighbour]
    C --> E[~300-word passages]
    D & E --> F[RoBERTa classifier<br/>one batched pass]
    F --> G[Document score<br/>word-weighted passages]
    F --> H[Per-sentence scores]
    G & H --> I[Verdict: ai / mixed / human]
```

1. **Normalise.** Invisible characters are removed, the text is NFKC-normalised, and Cyrillic/Greek look-alikes inside Latin words are mapped back. Genuine Russian or Greek text is left alone.
2. **Split.** A regex splitter that knows about abbreviations (`Dr.`, `e.g.`, `U.S.`) produces sentence spans with character offsets, so highlights map back onto the original text exactly, line breaks included.
3. **Score.** Each sentence is scored together with its neighbours, because single short sentences are too noisy to classify alone. The text is also split into ~300-word passages (the model's sweet spot under its 512-token limit) for the document-level score.
4. **Classify.** Everything goes through the model in batches sorted by length, so little compute is spent on padding. A typical 250-word text takes about 0.9 seconds on 2 CPU threads.
5. **Verdict.** The document score sets the verdict (≥ 95% AI, ≤ 50% human, in between is mixed). If 35–65% of the words sit in sentences scoring ≥ 99%, the verdict becomes **mixed**. The model's scores bunch up near 0 and 1, which is why the calibrated cut-offs sit high.

> AI detectors are probabilistic and produce false positives, especially on short, formal or non-native English writing. Treat results as one signal, never as proof.

## Project structure

```
backend/          FastAPI service
  app/
    main.py       routes, CORS, rate limiting, app factory
    analysis.py   sentence splitting, scoring, verdict logic
    detector.py   Hugging Face model wrapper (swappable via a Protocol)
    normalize.py  evasion defence: invisible characters and look-alike letters
    files.py      PDF / DOCX / TXT extraction
  eval/           benchmark: dataset builder, attacks, runner, threshold calibration
  tests/          pytest suite (uses a fake detector, so no model download)
  Dockerfile      model weights baked in for fast cold starts
frontend/         React 19 + TypeScript + Tailwind v4 (Vite)
  src/pages/      Home, Detect, Benchmarks, History
  src/lib/        API client, localStorage history store
ModelTrainer/     original 2025 ELECTRA fine-tuning notebook
docs/             original 2025 capstone report
scripts/          Hugging Face Space deploy script
```

## Running locally

You'll need [uv](https://docs.astral.sh/uv/) and Node 22+.

```bash
# API on http://127.0.0.1:8000 (docs at /docs). The first run downloads the ~500 MB model.
cd backend
uv sync
uv run uvicorn app.main:app --reload

# Web app on http://localhost:5173
cd frontend
npm install
npm run dev
```

Tests and linting:

```bash
cd backend && uv run pytest && uv run ruff check .
cd frontend && npm test && npm run lint && npm run build
```

### Reproducing the benchmark

The datasets are downloaded from Hugging Face rather than committed (the persuasion set is CC BY-NC-SA). The 2025 ELECTRA checkpoint is in the original repo's Git LFS history.

```bash
cd backend
uv run --group eval python -m eval.build       # test + calibration sets, ~250 MB download
uv run --group eval python -m eval.calibrate   # grid-search verdict thresholds (calibration set only)
uv run --group eval python -m eval.run --electra path/to/electra-checkpoint
```

`eval.run` writes `eval/results.json` and the copy the Benchmarks page imports. It takes about 25 minutes on an M-series Mac.

### Configuration

Backend settings come from `AICD_*` environment variables (see [`backend/.env.example`](backend/.env.example)):

| Variable | Default | |
|---|---|---|
| `AICD_MODEL_ID` | `fakespot-ai/roberta-base-ai-text-detection-v1` | Any HF sequence classifier with an `AI` label |
| `AICD_CORS_ORIGINS` | localhost dev ports | JSON list |
| `AICD_CORS_ORIGIN_REGEX` | none | e.g. `https://.*\.vercel\.app` |
| `AICD_RATE_LIMIT_PER_MINUTE` | `30` | Per client IP, `0` disables |
| `AICD_MAX_CHARS` | `50000` | |

The frontend reads `VITE_API_URL` at build time.

## API

| Method | Path | Body | |
|---|---|---|---|
| `GET` | `/api/health` | | Model status and limits |
| `POST` | `/api/detect` | `{"text": "..."}` | Analyse text |
| `POST` | `/api/detect/file` | multipart `file` | Analyse a PDF / DOCX / TXT / MD |

```bash
curl -X POST https://zubair-elliot-17-aicd-api.hf.space/api/detect \
  -H 'Content-Type: application/json' \
  -d '{"text": "Paste at least ten words of text here to see how the detector scores it."}'
```

## Deployment

- **Backend:** a Docker [Hugging Face Space](https://huggingface.co/docs/hub/spaces-sdks-docker) (free CPU tier). `.github/workflows/deploy-backend.yml` redeploys it when `backend/` changes on `main`. It needs an `HF_TOKEN` secret and an `HF_SPACE` variable. `keepalive.yml` pings it daily so it doesn't go to sleep.
- **Frontend:** Vercel, root directory `frontend/`, with `VITE_API_URL` pointing at the Space.

## Acknowledgements

- Benchmark data: [Anthropic/persuasion](https://huggingface.co/datasets/Anthropic/persuasion) (CC BY-NC-SA 4.0) and the [COLING 2025 MGT shared task](https://huggingface.co/datasets/Jinyan1/COLING_2025_MGT_en). Attacks follow [RAID](https://github.com/liamdugan/raid) (Dugan et al., 2024).
- Detection model: [fakespot-ai/roberta-base-ai-text-detection-v1](https://huggingface.co/fakespot-ai/roberta-base-ai-text-detection-v1) (Apache-2.0), from Mozilla's Fakespot team ([ApolloDFT](https://github.com/FakespotAILabs/ApolloDFT)).
- Built for CSC3003S at the University of Cape Town.
