# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings, overridable with AICD_* environment variables."""

    model_config = SettingsConfigDict(env_prefix="AICD_", env_file=".env", extra="ignore")

    model_id: str = "fakespot-ai/roberta-base-ai-text-detection-v1"
    model_revision: str | None = None
    batch_size: int = 16

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ]
    cors_origin_regex: str | None = None

    min_words: int = 10
    max_chars: int = 50_000
    max_file_bytes: int = 1_000_000

    rate_limit_per_minute: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
