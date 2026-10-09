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
AI_THRESHOLD = 0.7
HUMAN_THRESHOLD = 0.3
MIXED_SHARE = 0.2
MIN_SENTENCES_FOR_MIX = 4


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


def _chunks(spans: list[Span]) -> list[str]:
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


def ai_share(sentences: list[SentenceScore]) -> float:
    """Fraction of scored words that sit in sentences leaning AI."""
    scored = [(s, _word_count(s.text)) for s in sentences if s.ai_probability is not None]
    total = sum(n for _, n in scored)
    if not total:
        return 0.0
    return sum(n for s, n in scored if s.ai_probability >= 0.5) / total


def verdict_for(probability: float, share: float | None = None, scored: int = 0) -> str:
    # A document-level score can't see a human essay with an AI paragraph pasted in,
    # so a clear split at sentence level overrides it.
    if (
        share is not None
        and scored >= MIN_SENTENCES_FOR_MIX
        and MIXED_SHARE < share < 1 - MIXED_SHARE
    ):
        return "mixed"
    if probability >= AI_THRESHOLD:
        return "ai"
    if probability <= HUMAN_THRESHOLD:
        return "human"
    return "mixed"


def analyse(text: str, detector: Detector) -> Analysis:
    spans = split_sentences(text)
    scorable = [i for i, s in enumerate(spans) if _word_count(s.text) >= MIN_SCORABLE_WORDS]

    # Each sentence is scored with its neighbours so single short lines aren't judged blind.
    windows = [" ".join(s.text for s in spans[max(0, i - 1) : i + 2]) for i in scorable]
    chunks = _chunks(spans)
    probs = detector.predict(chunks + windows)
    chunk_probs, window_probs = probs[: len(chunks)], probs[len(chunks) :]

    weights = [_word_count(c) for c in chunks]
    overall = sum(p * w for p, w in zip(chunk_probs, weights, strict=True)) / max(sum(weights), 1)

    by_index = dict(zip(scorable, window_probs, strict=True))
    sentences = [
        SentenceScore(s.start, s.end, s.text, by_index.get(i)) for i, s in enumerate(spans)
    ]
    share = ai_share(sentences)
    return Analysis(
        ai_probability=overall,
        verdict=verdict_for(overall, share, len(scorable)),
        confidence=abs(overall - 0.5) * 2,
        word_count=_word_count(text),
        sentences=sentences,
        ai_sentence_share=share,
    )
