# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Fine-tune the detector on argumentative essays without forgetting other domains.

Usage: python -m eval.finetune [--limit N]

Training data never overlaps the test or calibration sets: DAIGT essays come from prompts
the calibration set doesn't use, and COLING texts from a different shard of its train split.
"""

import argparse
import math
import random
import time
from pathlib import Path

import pandas as pd
import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

from app.analysis import passages, split_sentences
from app.config import get_settings
from app.detector import clean_text
from eval.build import (
    CALIBRATION,
    COLING_MODELS,
    DAIGT_CALIBRATION_PROMPTS,
    SEED,
    _load,
    daigt,
)
from eval.build import (
    OUT as TEST,
)

OUT = Path(__file__).parent / "data/aicd-roberta"
PER_KIND = 2500  # documents per (source, human/AI)
MAX_TOKENS = 320
BATCH = 16
LR = 1e-5


def documents() -> pd.DataFrame:
    essays = daigt()
    essays = essays[~essays.prompt_name.isin(DAIGT_CALIBRATION_PROMPTS)]
    # Spread the AI essays across every generator family in DAIGT.
    ai = essays[essays.label == 1]
    ai = ai.groupby("source", group_keys=False).apply(
        lambda g: g.sample(n=min(len(g), PER_KIND // ai.source.nunique() + 1), random_state=SEED)
    )
    ai = ai.sample(frac=1, random_state=SEED).head(PER_KIND)
    essays = pd.concat([essays[essays.label == 0].sample(n=PER_KIND, random_state=SEED), ai])

    coling = _load(
        "Jinyan1/COLING_2025_MGT_en",
        "default/train/0001.parquet",
        {"text": "text", "model": "generator", "sub_source": "domain"},
    )
    coling_ai = coling[coling.generator.isin(COLING_MODELS)].sample(n=PER_KIND, random_state=SEED)
    coling_human = coling[coling.generator == "human"].sample(n=PER_KIND, random_state=SEED)
    coling = pd.concat([coling_ai.assign(label=1), coling_human.assign(label=0)])

    docs = pd.concat([essays[["text", "label"]], coling[["text", "label"]]], ignore_index=True)
    held_out = pd.concat([pd.read_json(p, lines=True) for p in (TEST, CALIBRATION)])
    seen = set(held_out.text.str[:200])
    return docs[~docs.text.str[:200].isin(seen)].reset_index(drop=True)


def examples(docs: pd.DataFrame) -> list[tuple[str, int]]:
    """One ~300-word passage and one 3-sentence window per document: the shapes the app scores."""
    rng = random.Random(SEED)
    out = []
    for text, label in zip(docs.text, docs.label, strict=True):
        spans = split_sentences(text)
        out.append((passages(spans)[0], label))
        if len(spans) >= 3:
            i = rng.randrange(len(spans) - 2)
            out.append((" ".join(s.text for s in spans[i : i + 3]), label))
    rng.shuffle(out)
    return out


def batches(tokenizer, data: list[tuple[str, int]]):
    """Length-bucketed batches padded to a multiple of 64, so the GPU sees few distinct shapes."""
    enc = tokenizer([clean_text(t) for t, _ in data], truncation=True, max_length=MAX_TOKENS)
    order = sorted(range(len(data)), key=lambda i: len(enc["input_ids"][i]))
    groups = [order[i : i + BATCH] for i in range(0, len(order), BATCH)]
    random.Random(SEED).shuffle(groups)
    for idx in groups:
        width = min(MAX_TOKENS, math.ceil(max(len(enc["input_ids"][i]) for i in idx) / 64) * 64)
        ids = torch.full((len(idx), width), tokenizer.pad_token_id)
        mask = torch.zeros((len(idx), width), dtype=torch.long)
        for row, i in enumerate(idx):
            seq = enc["input_ids"][i]
            ids[row, : len(seq)] = torch.tensor(seq)
            mask[row, : len(seq)] = 1
        yield ids, mask, torch.tensor([data[i][1] for i in idx])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Train on the first N examples (smoke test)")
    args = parser.parse_args()

    torch.manual_seed(SEED)
    docs = documents()
    data = examples(docs)[: args.limit]
    print(f"{len(docs)} documents -> {len(data)} examples", flush=True)

    model_id = get_settings().model_id
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForSequenceClassification.from_pretrained(model_id).to(device)
    ai_index = {k.lower(): v for k, v in model.config.label2id.items()}.get("ai", 1)

    steps = math.ceil(len(data) / BATCH)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)
    schedule = get_linear_schedule_with_warmup(optimizer, int(0.06 * steps), steps)
    model.train()
    started = time.perf_counter()
    for step, (ids, mask, labels) in enumerate(batches(tokenizer, data), 1):
        # The model's AI class index may not be 1, so map our 0/1 labels onto its classes.
        targets = labels if ai_index == 1 else 1 - labels
        loss = model(
            input_ids=ids.to(device), attention_mask=mask.to(device), labels=targets.to(device)
        ).loss
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        schedule.step()
        optimizer.zero_grad()
        if step % 50 == 0 or step == steps:
            rate = step / (time.perf_counter() - started)
            print(f"step {step}/{steps} loss {loss.item():.4f} ({rate:.2f} steps/s)", flush=True)

    if args.limit:
        return
    model.save_pretrained(OUT)
    tokenizer.save_pretrained(OUT)
    print(f"Saved {OUT}")


if __name__ == "__main__":
    main()
