# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Model wrapper. Anything with a `predict(texts) -> list[float]` method can stand in for it."""

import re
import threading
from collections.abc import Sequence
from html import unescape
from typing import Protocol


class Detector(Protocol):
    name: str

    def predict(self, texts: Sequence[str]) -> list[float]:
        """Return the probability that each text is AI-generated."""
        ...


def clean_text(text: str) -> str:
    """Strip markdown/HTML noise the way the Fakespot model was trained (their utils.py)."""
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"`[^`]*`", "", text)
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\(.*?\)", r"\1", text)
    text = re.sub(r"(\*\*|__)(.*?)\1", r"\2", text)
    text = re.sub(r"(?<!\w)(\*|_)(.+?)\1(?!\w)", r"\2", text)
    text = re.sub(r"^#+ ", "", text, flags=re.MULTILINE)
    text = re.sub(r"^(\s*[-*+]|\d+\.)\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"<.*?>", "", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).replace(" ,", ",")
    return text.strip()


class TransformerDetector:
    """Hugging Face sequence classifier with an "AI" label, run on CPU."""

    def __init__(self, model_id: str, revision: str | None = None, batch_size: int = 16):
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        self._torch = torch
        self.name = model_id
        self.batch_size = batch_size
        self.tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_id, revision=revision)
        self.model.eval()
        label2id = {k.lower(): v for k, v in self.model.config.label2id.items()}
        self.ai_index = label2id.get("ai", 1)
        # Concurrent forward passes just fight over the same CPU cores.
        self._lock = threading.Lock()

    def predict(self, texts: Sequence[str]) -> list[float]:
        cleaned = [clean_text(t) for t in texts]
        probs: list[float] = []
        with self._lock, self._torch.inference_mode():
            for i in range(0, len(cleaned), self.batch_size):
                batch = cleaned[i : i + self.batch_size]
                enc = self.tokenizer(
                    batch, truncation=True, max_length=512, padding=True, return_tensors="pt"
                )
                logits = self.model(**enc).logits
                probs.extend(logits.softmax(dim=-1)[:, self.ai_index].tolist())
        return probs
