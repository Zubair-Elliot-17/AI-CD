# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Score the benchmark with each detector. Usage: python -m eval.run --electra PATH"""

import argparse
import json
import platform
import random
import statistics
import time
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import transformers
from sklearn.metrics import f1_score, roc_auc_score, roc_curve

from app.analysis import THRESHOLDS, Thresholds, analyse, document_score, passages, split_sentences
from app.config import get_settings
from app.detector import TransformerDetector
from app.normalize import normalize
from eval.attacks import ATTACKS
from eval.build import OUT as DATA

ROOT = Path(__file__).resolve().parent
RESULTS = [ROOT / "results.json", ROOT.parent.parent / "frontend/src/data/benchmark.json"]
SEED = 17
BOOTSTRAP = 1000


def _identity(text: str) -> str:
    return text


def _normalized(text: str) -> str:
    return normalize(text)[0]


def document_scores(detector, texts: list[str]) -> np.ndarray:
    """The API's document-level score, batched across every text at once."""
    chunked = [passages(split_sentences(t)) for t in texts]
    flat = detector.predict([c for chunks in chunked for c in chunks])
    scores, i = [], 0
    for chunks in chunked:
        scores.append(document_score(chunks, flat[i : i + len(chunks)]))
        i += len(chunks)
    return np.array(scores)


def metrics(y: np.ndarray, p: np.ndarray) -> dict:
    rng = np.random.default_rng(SEED)
    boot = []
    for _ in range(BOOTSTRAP):
        idx = rng.integers(0, len(y), len(y))
        if 0 < y[idx].sum() < len(idx):
            boot.append(roc_auc_score(y[idx], p[idx]))
    fpr, tpr, _ = roc_curve(y, p)
    flagged = p >= THRESHOLDS.ai
    return {
        "auroc": round(roc_auc_score(y, p), 4),
        "auroc_ci": [round(float(np.percentile(boot, q)), 4) for q in (2.5, 97.5)],
        "accuracy": round(float(((p >= 0.5) == y).mean()), 4),
        "f1": round(f1_score(y, p >= 0.5), 4),
        # Share of AI texts caught while wrongly flagging at most 1% of human ones.
        "tpr_at_1pct_fpr": round(float(np.interp(0.01, fpr, tpr)), 4),
        # The app calls a text "AI" at 95%, so these are its real hit and false-accusation rates.
        "tpr": round(float(flagged[y == 1].mean()), 4),
        "fpr": round(float(flagged[y == 0].mean()), 4),
    }


def roc_points(y: np.ndarray, p: np.ndarray, n: int = 60) -> list[list[float]]:
    fpr, tpr, _ = roc_curve(y, p)
    grid = np.linspace(0, 1, n)
    return [[round(float(x), 4), round(float(np.interp(x, fpr, tpr)), 4)] for x in grid]


def breakdowns(df: pd.DataFrame, p: np.ndarray) -> dict:
    flagged = p >= THRESHOLDS.ai
    out = {"by_dataset": {}, "by_generator": {}, "human_fpr_by_domain": {}}
    for name, idx in df.groupby("dataset").groups.items():
        out["by_dataset"][name] = metrics(df.label.loc[idx].to_numpy(), p[idx])
    ai = df[df.label == 1]
    for gen, idx in ai.groupby("generator").groups.items():
        out["by_generator"][gen] = {"tpr": round(float(flagged[idx].mean()), 4), "n": len(idx)}
    human = df[df.label == 0]
    for dom, idx in human.groupby("domain").groups.items():
        fpr = round(float(flagged[idx].mean()), 4)
        out["human_fpr_by_domain"][dom] = {"fpr": fpr, "n": len(idx)}
    return out


def histogram(y: np.ndarray, p: np.ndarray, bins: int = 20) -> dict:
    edges = np.linspace(0, 1, bins + 1)
    return {
        "edges": [round(float(e), 2) for e in edges],
        "human": np.histogram(p[y == 0], edges)[0].tolist(),
        "ai": np.histogram(p[y == 1], edges)[0].tolist(),
    }


class Recorder:
    """Stands in for a detector: first to collect every input, then to serve cached scores."""

    name = "recorder"

    def __init__(self, scores: dict[str, float] | None = None):
        self.scores = scores
        self.seen: list[str] = []

    def predict(self, texts):
        if self.scores is None:
            self.seen.extend(texts)
            return [0.5] * len(texts)
        return [self.scores[t] for t in texts]

    @classmethod
    def prefetch(cls, detector, texts: list[str]) -> "Recorder":
        """Score every input the full pipeline needs in one batched pass."""
        recorder = cls()
        for t in texts:
            analyse(t, recorder)
        unique = list(dict.fromkeys(recorder.seen))
        return cls(dict(zip(unique, detector.predict(unique), strict=True)))


# The cut-offs the app shipped with before calibration, kept for comparison.
UNCALIBRATED = Thresholds(ai=0.7, human=0.3, sentence=0.5, mixed_share=0.2, min_sentences=4)


def verdicts(detector, df: pd.DataFrame) -> dict:
    """Run the full sentence-level pipeline and count the verdicts the app would show."""
    texts = [normalize(t)[0] for t in df.text]
    lookup = Recorder.prefetch(detector, texts)
    out = {}
    for name, t in (("calibrated", THRESHOLDS), ("uncalibrated", UNCALIBRATED)):
        counts = {kind: {"ai": 0, "mixed": 0, "human": 0} for kind in ("human", "ai", "mixed")}
        for text, kind in zip(texts, df.kind, strict=True):
            counts[kind][analyse(text, lookup, t).verdict] += 1
        out[name] = counts
    return out


def latency(model_id: str, texts: list[str]) -> dict:
    """Wall-clock time for the full analysis on CPU, which is what the server runs on."""
    torch.set_num_threads(2)  # The Hugging Face free tier has 2 vCPUs.
    detector = TransformerDetector(model_id)
    analyse(texts[0], detector)
    times = []
    for text in texts:
        started = time.perf_counter()
        analyse(text, detector)
        times.append((time.perf_counter() - started) * 1000)
    return {"median_ms": round(statistics.median(times)), "p90_ms": round(np.percentile(times, 90))}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--electra", required=True, help="Path to the 2025 ELECTRA checkpoint")
    parser.add_argument("--latency-samples", type=int, default=40)
    args = parser.parse_args()

    full = pd.read_json(DATA, lines=True)
    df = full[full.label >= 0].reset_index(drop=True)
    y = df.label.to_numpy()
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    roberta = get_settings().model_id

    rng = random.Random(SEED)
    conditions = {"clean": df.text.tolist()}
    for name, attack in ATTACKS.items():
        conditions[name] = [attack(t, rng) if lbl else t for t, lbl in zip(df.text, y, strict=True)]

    systems: dict[str, tuple[str, str, Callable[[str], str]]] = {
        "electra_2025": ("2025 capstone (ELECTRA)", args.electra, _identity),
        "roberta_raw": ("2026 model, no input defence", roberta, _identity),
        "roberta_2026": ("2026 rebuild (RoBERTa + defence)", roberta, _normalized),
    }
    results: dict = {}
    clean_scores: dict[str, np.ndarray] = {}
    for key, (label, model_id, prep) in systems.items():
        detector = TransformerDetector(model_id, batch_size=32, device=device)
        name = "electra-base (fine-tuned)" if key == "electra_2025" else model_id.split("/")[-1]
        entry = {"label": label, "model": name, "conditions": {}}
        for cond, texts in conditions.items():
            started = time.perf_counter()
            p = document_scores(detector, [prep(t) for t in texts])
            entry["conditions"][cond] = metrics(y, p)
            took = time.perf_counter() - started
            print(f"{key:14} {cond:11} {entry['conditions'][cond]} ({took:.0f}s)", flush=True)
            if cond == "clean":
                clean_scores[key] = p
        entry["roc"] = roc_points(y, clean_scores[key])
        entry["histogram"] = histogram(y, clean_scores[key])
        entry.update(breakdowns(df, clean_scores[key]))
        if key == "roberta_2026":
            entry["verdicts"] = verdicts(detector, full)
        results[key] = entry
        del detector

    sample = df.sample(n=args.latency_samples, random_state=SEED).text.tolist()
    for key in ("electra_2025", "roberta_2026"):
        results[key]["latency"] = latency(systems[key][1], sample)

    report = {
        "generated": datetime.now(UTC).strftime("%Y-%m-%d"),
        "threshold": THRESHOLDS.ai,
        "thresholds": THRESHOLDS.__dict__,
        "dataset": {
            "total": len(df),
            "ai": int(y.sum()),
            "human": int((1 - y).sum()),
            "mixed": int((full.kind == "mixed").sum()),
            "composition": {
                ds: {gen: len(g) for gen, g in part.groupby("generator")}
                for ds, part in df.groupby("dataset")
            },
        },
        "environment": {
            "torch": torch.__version__,
            "transformers": transformers.__version__,
            "machine": platform.machine(),
        },
        "systems": results,
    }
    for path in RESULTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Wrote {', '.join(str(p) for p in RESULTS)}")


if __name__ == "__main__":
    main()
