# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

from collections.abc import Sequence

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


class FakeDetector:
    """Scores text as AI if it contains the word "delve". Deterministic and instant."""

    name = "fake-detector"

    def __init__(self):
        self.calls: list[list[str]] = []

    def predict(self, texts: Sequence[str]) -> list[float]:
        self.calls.append(list(texts))
        return [0.95 if "delve" in t.lower() else 0.05 for t in texts]


@pytest.fixture
def detector() -> FakeDetector:
    return FakeDetector()


@pytest.fixture
def settings() -> Settings:
    return Settings(rate_limit_per_minute=0, max_file_bytes=200_000)


@pytest.fixture
def client(settings, detector) -> TestClient:
    with TestClient(create_app(settings, detector)) as c:
        yield c
