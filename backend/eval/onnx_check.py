# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Check the browser's ONNX exports score the benchmark like the PyTorch model.

Usage: python -m eval.onnx_check DIR  (DIR holds model.onnx, model_quantized.onnx and the tokenizer)
"""

import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
import torch
from transformers import AutoConfig, AutoTokenizer

from app.config import get_settings
from app.detector import TransformerDetector, clean_text
from app.normalize import normalize
from eval.build import OUT as DATA
from eval.run import document_scores, metrics, verdicts

OUT = Path(__file__).parent / "onnx.json"


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
    texts = [normalize(t)[0] for t in df.text]
    device = "mps" if torch.backends.mps.is_available() else "cpu"

    variants = {
        "pytorch": lambda: TransformerDetector(
            get_settings().model_id, batch_size=32, device=device
        ),
        "onnx_fp32": lambda: OnnxDetector(folder, "model.onnx"),
        "onnx_q8": lambda: OnnxDetector(folder, "model_quantized.onnx"),
    }
    report, reference = {}, None
    for key, make in variants.items():
        detector = make()
        p = document_scores(detector, texts)
        entry = {"clean": metrics(y, p), "verdicts": verdicts(detector, full)["calibrated"]}
        if reference is None:
            reference = p
        else:
            entry["max_abs_diff"] = round(float(np.abs(p - reference).max()), 4)
            entry["mean_abs_diff"] = round(float(np.abs(p - reference).mean()), 5)
        report[key] = entry
        print(key, json.dumps(entry), flush=True)
    OUT.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
