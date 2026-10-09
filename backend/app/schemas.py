# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

from typing import Literal

from pydantic import BaseModel, Field


class DetectRequest(BaseModel):
    text: str = Field(min_length=1)


class SentenceResult(BaseModel):
    start: int
    end: int
    text: str
    ai_probability: float | None = Field(description="Null when the sentence is too short to score")


class DetectResponse(BaseModel):
    id: str
    verdict: Literal["ai", "mixed", "human"]
    ai_probability: float
    confidence: float
    ai_sentence_share: float
    word_count: int
    char_count: int
    sentences: list[SentenceResult]
    text: str
    source: Literal["text", "file"]
    filename: str | None = None
    model: str
    elapsed_ms: int


class HealthResponse(BaseModel):
    status: Literal["ok", "loading"]
    model: str
    min_words: int
    max_chars: int
    max_file_bytes: int
    supported_extensions: list[str]


class ErrorResponse(BaseModel):
    detail: str
