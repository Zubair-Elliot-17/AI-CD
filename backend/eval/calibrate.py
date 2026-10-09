# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Grid-search verdict thresholds on the calibration set. Usage: python -m eval.calibrate"""

import itertools
import json
from collections import Counter
from pathlib import Path

import pandas as pd
import torch

from app.analysis import THRESHOLDS, Thresholds, analyse
from app.config import get_settings
from app.detector import TransformerDetector
from app.normalize import normalize
from eval.build import CALIBRATION
from eval.run import Recorder

OUT = Path(__file__).parent / "calibration.json"
MAX_HUMAN_AS_AI = 0.05  # never call more than 5% of human texts "AI"

GRID = {
    "ai": [0.7, 0.8, 0.9, 0.95],
    "human": [0.3, 0.5, 0.7],
    "sentence": [0.5, 0.8, 0.9, 0.95, 0.97, 0.99],
    "mixed_share": [0.2, 0.25, 0.3, 0.35],
    "min_sentences": [4, 8],
}


def confusion(texts: list[str], kinds: list[str], lookup: Recorder, t: Thresholds) -> dict:
    counts = {k: Counter() for k in ("human", "ai", "mixed")}
    for text, kind in zip(texts, kinds, strict=True):
        counts[kind][analyse(text, lookup, t).verdict] += 1
    return {
        k: {v: c[v] / max(sum(c.values()), 1) for v in ("ai", "mixed", "human")}
        for k, c in counts.items()
    }


def score(conf: dict) -> float:
    """Mean recall over the three kinds of document."""
    return sum(conf[k][k] for k in conf) / len(conf)


def main() -> None:
    df = pd.read_json(CALIBRATION, lines=True)
    texts = [normalize(t)[0] for t in df.text]
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    detector = TransformerDetector(get_settings().model_id, batch_size=32, device=device)
    lookup = Recorder.prefetch(detector, texts)

    candidates = []
    for values in itertools.product(*GRID.values()):
        t = Thresholds(**dict(zip(GRID, values, strict=True)))
        if t.human >= t.ai:
            continue
        conf = confusion(texts, df.kind.tolist(), lookup, t)
        if conf["human"]["ai"] <= MAX_HUMAN_AS_AI:
            candidates.append((score(conf), t, conf))
    candidates.sort(key=lambda c: -c[0])

    current = confusion(texts, df.kind.tolist(), lookup, THRESHOLDS)
    print(f"current  {score(current):.3f} {THRESHOLDS}\n  {current}")
    for s, t, conf in candidates[:8]:
        print(f"{s:.3f} {t}\n  {conf}")

    best_score, best, best_conf = candidates[0]
    OUT.write_text(
        json.dumps(
            {
                "texts": len(df),
                "constraint": f"human texts called AI <= {MAX_HUMAN_AS_AI:.0%}",
                "previous": {
                    "thresholds": THRESHOLDS.__dict__,
                    "score": score(current),
                    "confusion": current,
                },
                "chosen": {
                    "thresholds": best.__dict__,
                    "score": best_score,
                    "confusion": best_conf,
                },
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
