# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Splits text into sentences, scores them, and rolls the scores up into a verdict."""

import re
from dataclasses import dataclass

from app.detector import Detector

ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "e.g", "i.e", "fig",
    "no", "vol", "approx", "inc", "ltd", "co", "u.s", "u.k", "a.m", "p.m",
}  # fmt: skip

# A boundary is .!? (plus closing quotes/brackets) followed by whitespace, or a line break.
_BOUNDARY = re.compile(r"(?<=[.!?])[\"')\]]*\s+|\n+")
_WORD = re.compile(r"\S+")

MIN_SCORABLE_WORDS = 4
CHUNK_WORDS = 300


@dataclass(frozen=True)
class Thresholds:
    """Verdict cut-offs, tuned on a separate calibration set by eval/calibrate.py.

    The model's scores bunch up near 0 and 1, so the cut-offs that best separate human,
    AI and mixed writing sit high.
    """

    ai: float = 0.95  # document score at or above this is "ai"
    human: float = 0.5  # at or below this is "human"
    sentence: float = 0.99  # a sentence at or above this counts as AI-leaning
    mixed_share: float = 0.35  # AI-leaning share strictly inside (x, 1 - x) is "mixed"
    min_sentences: int = 8  # fewer scored sentences than this can't be "mixed"


THRESHOLDS = Thresholds()


@dataclass
class Span:
    start: int
    end: int
    text: str


@dataclass
class SentenceScore:
    start: int
    end: int
    text: str
    ai_probability: float | None


@dataclass
class Analysis:
    ai_probability: float
    verdict: str
    confidence: float
    word_count: int
    sentences: list[SentenceScore]

    ai_sentence_share: float


def split_sentences(text: str) -> list[Span]:
    """Return sentence spans with offsets into the original text."""
    spans: list[Span] = []
    start = 0
    for match in _BOUNDARY.finditer(text):
        candidate = text[start : match.start()].rstrip()
        if "\n" not in match.group() and _ends_with_abbreviation(candidate):
            continue
        _append_span(spans, text, start, match.end())
        start = match.end()
    _append_span(spans, text, start, len(text))
    return spans


def _ends_with_abbreviation(candidate: str) -> bool:
    last = candidate.rsplit(maxsplit=1)[-1] if candidate.strip() else ""
    token = last.rstrip(".\"')]").lstrip("\"'([").lower()
    return token in ABBREVIATIONS or (len(token) == 1 and token.isalpha())


def _append_span(spans: list[Span], text: str, start: int, end: int) -> None:
    raw = text[start:end]
    stripped = raw.strip()
    if not stripped:
        return
    lead = len(raw) - len(raw.lstrip())
    s = start + lead
    spans.append(Span(s, s + len(stripped), stripped))


def _word_count(text: str) -> int:
    return len(_WORD.findall(text))


def passages(spans: list[Span]) -> list[str]:
    """Group consecutive sentences into ~300-word passages for the document score."""
    chunks: list[str] = []
    current: list[str] = []
    words = 0
    for span in spans:
        n = _word_count(span.text)
        if current and words + n > CHUNK_WORDS:
            chunks.append(" ".join(current))
            current, words = [], 0
        current.append(span.text)
        words += n
    if current:
        chunks.append(" ".join(current))
    return chunks


def document_score(chunks: list[str], probs: list[float]) -> float:
    """Word-weighted mean of the passage scores."""
    weights = [_word_count(c) for c in chunks]
    return sum(p * w for p, w in zip(probs, weights, strict=True)) / max(sum(weights), 1)


def ai_share(sentences: list[SentenceScore], cutoff: float = THRESHOLDS.sentence) -> float:
    """Fraction of scored words that sit in sentences leaning AI."""
    scored = [(s, _word_count(s.text)) for s in sentences if s.ai_probability is not None]
    total = sum(n for _, n in scored)
    if not total:
        return 0.0
    return sum(n for s, n in scored if s.ai_probability >= cutoff) / total


def verdict_for(
    probability: float,
    share: float | None = None,
    scored: int = 0,
    t: Thresholds = THRESHOLDS,
) -> str:
    # A document-level score can't see a human essay with an AI paragraph pasted in,
    # so a clear split at sentence level overrides it.
    if (
        share is not None
        and scored >= t.min_sentences
        and t.mixed_share < share < 1 - t.mixed_share
    ):
        return "mixed"
    if probability >= t.ai:
        return "ai"
    if probability <= t.human:
        return "human"
    return "mixed"


def analyse(text: str, detector: Detector, t: Thresholds = THRESHOLDS) -> Analysis:
    spans = split_sentences(text)
    scorable = [i for i, s in enumerate(spans) if _word_count(s.text) >= MIN_SCORABLE_WORDS]

    # Each sentence is scored with its neighbours so single short lines aren't judged blind.
    windows = [" ".join(s.text for s in spans[max(0, i - 1) : i + 2]) for i in scorable]
    chunks = passages(spans)
    probs = detector.predict(chunks + windows)
    chunk_probs, window_probs = probs[: len(chunks)], probs[len(chunks) :]

    overall = document_score(chunks, chunk_probs)

    by_index = dict(zip(scorable, window_probs, strict=True))
    sentences = [
        SentenceScore(s.start, s.end, s.text, by_index.get(i)) for i, s in enumerate(spans)
    ]
    share = ai_share(sentences, t.sentence)
    return Analysis(
        ai_probability=overall,
        verdict=verdict_for(overall, share, len(scorable), t),
        confidence=abs(overall - 0.5) * 2,
        word_count=_word_count(text),
        sentences=sentences,
        ai_sentence_share=share,
    )
