# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Score the benchmark with the browser's 8-bit ONNX model, under both sets of thresholds.

Usage: python -m eval.onnx_check DIR  (DIR holds model_quantized.onnx and the tokenizer)
"""

import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
from transformers import AutoConfig, AutoTokenizer

from app.analysis import THRESHOLDS, Thresholds, analyse
from app.detector import clean_text
from app.normalize import normalize
from eval.build import OUT as DATA
from eval.run import Recorder, document_scores, metrics

OUT = [
    Path(__file__).parent / "onnx.json",
    Path(__file__).parents[2] / "frontend/src/data/onnx.json",
]
RESULTS = Path(__file__).parent / "results.json"
TUNED = Path(__file__).parent / "calibration_q8.json"


class OnnxDetector:
    def __init__(self, folder: Path, file: str, batch_size: int = 32):
        self.name = file
        self.batch_size = batch_size
        self.tokenizer = AutoTokenizer.from_pretrained(folder)
        label2id = {k.lower(): v for k, v in AutoConfig.from_pretrained(folder).label2id.items()}
        self.ai_index = label2id.get("ai", 1)
        self.session = ort.InferenceSession(str(folder / file), providers=["CPUExecutionProvider"])

    def predict(self, texts):
        cleaned = [clean_text(t) for t in texts]
        order = sorted(range(len(cleaned)), key=lambda i: len(cleaned[i]))
        probs = [0.0] * len(cleaned)
        for start in range(0, len(order), self.batch_size):
            idx = order[start : start + self.batch_size]
            enc = self.tokenizer(
                [cleaned[i] for i in idx],
                truncation=True,
                max_length=512,
                padding=True,
                return_tensors="np",
            )
            (logits,) = self.session.run(
                None, {"input_ids": enc["input_ids"], "attention_mask": enc["attention_mask"]}
            )
            e = np.exp(logits - logits.max(axis=1, keepdims=True))
            scores = (e / e.sum(axis=1, keepdims=True))[:, self.ai_index]
            for i, p in zip(idx, scores.tolist(), strict=True):
                probs[i] = p
        return probs


def main(folder: Path) -> None:
    full = pd.read_json(DATA, lines=True)
    df = full[full.label >= 0].reset_index(drop=True)
    y = df.label.to_numpy()
    detector = OnnxDetector(folder, "model_quantized.onnx")
    p = document_scores(detector, [normalize(t)[0] for t in df.text])

    texts = [normalize(t)[0] for t in full.text]
    lookup = Recorder.prefetch(detector, texts)
    tuned = Thresholds(**json.loads(TUNED.read_text())["chosen"]["thresholds"])

    def counts(t: Thresholds) -> dict:
        out = {k: {"ai": 0, "mixed": 0, "human": 0} for k in ("human", "ai", "mixed")}
        for text, kind in zip(texts, full.kind, strict=True):
            out[kind][analyse(text, lookup, t).verdict] += 1
        return out

    reference = json.loads(RESULTS.read_text())["systems"]["roberta_2026"]
    report = {
        "pytorch": {
            "clean": reference["conditions"]["clean"],
            "verdicts": reference["verdicts"]["calibrated"],
        },
        "onnx_q8": {
            "clean": metrics(y, p),
            "verdicts": counts(THRESHOLDS),
            "verdicts_tuned": counts(tuned),
            "tuned_thresholds": tuned.__dict__,
        },
    }
    print(json.dumps(report["onnx_q8"]), flush=True)
    for path in OUT:
        path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Wrote {', '.join(map(str, OUT))}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
