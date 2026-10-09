# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from app.analysis import analyse
from app.config import Settings, get_settings
from app.detector import Detector, TransformerDetector
from app.files import SUPPORTED_EXTENSIONS, FileError, extract_text
from app.normalize import normalize
from app.ratelimit import RateLimiter
from app.schemas import (
    DetectRequest,
    DetectResponse,
    ErrorResponse,
    HealthResponse,
    SentenceResult,
    TamperingResult,
)

log = logging.getLogger("aicd")


def create_app(settings: Settings | None = None, detector: Detector | None = None) -> FastAPI:
    """Build the app. Tests pass a fake detector so the real model never loads."""
    settings = settings or get_settings()
    limiter = RateLimiter(settings.rate_limit_per_minute)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if app.state.detector is None:
            log.info("Loading model %s", settings.model_id)
            app.state.detector = await run_in_threadpool(
                TransformerDetector, settings.model_id, settings.model_revision, settings.batch_size
            )
            log.info("Model ready")
        yield

    app = FastAPI(
        title="AI Content Detector API",
        version="2.0.0",
        lifespan=lifespan,
        responses={400: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    )
    app.state.detector = detector
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    def rate_limit(request: Request) -> None:
        forwarded = request.headers.get("x-forwarded-for", "")
        client = forwarded.split(",")[0].strip() or (request.client.host if request.client else "")
        if not limiter.allow(client):
            raise HTTPException(429, "Too many requests. Try again in a minute.")

    def get_detector() -> Detector:
        if app.state.detector is None:
            raise HTTPException(503, "Model is still loading. Try again shortly.")
        return app.state.detector

    def run_detection(
        text: str,
        detector: Detector,
        source: Literal["text", "file"],
        filename: str | None = None,
    ) -> DetectResponse:
        text, tampering = normalize(text.strip())
        words = len(text.split())
        if words < settings.min_words:
            raise HTTPException(400, f"Text must be at least {settings.min_words} words long.")
        if len(text) > settings.max_chars:
            raise HTTPException(400, f"Text must be under {settings.max_chars:,} characters.")

        started = time.perf_counter()
        result = analyse(text, detector)
        return DetectResponse(
            id=str(uuid.uuid4()),
            verdict=result.verdict,
            ai_probability=round(result.ai_probability, 4),
            confidence=round(result.confidence, 4),
            ai_sentence_share=round(result.ai_sentence_share, 4),
            word_count=result.word_count,
            char_count=len(text),
            sentences=[
                SentenceResult(
                    start=s.start,
                    end=s.end,
                    text=s.text,
                    ai_probability=None if s.ai_probability is None else round(s.ai_probability, 4),
                )
                for s in result.sentences
            ],
            text=text,
            source=source,
            filename=filename,
            model=detector.name,
            tampering=TamperingResult(
                invisible_chars=tampering.invisible_chars, homoglyphs=tampering.homoglyphs
            ),
            elapsed_ms=round((time.perf_counter() - started) * 1000),
        )

    @app.get("/api/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok" if app.state.detector is not None else "loading",
            model=settings.model_id,
            min_words=settings.min_words,
            max_chars=settings.max_chars,
            max_file_bytes=settings.max_file_bytes,
            supported_extensions=sorted(SUPPORTED_EXTENSIONS),
        )

    DetectorDep = Annotated[Detector, Depends(get_detector)]

    # Sync handlers run in FastAPI's threadpool, so inference doesn't block the event loop.
    @app.post("/api/detect", response_model=DetectResponse, dependencies=[Depends(rate_limit)])
    def detect_text(body: DetectRequest, detector: DetectorDep):
        return run_detection(body.text, detector, "text")

    @app.post("/api/detect/file", response_model=DetectResponse, dependencies=[Depends(rate_limit)])
    def detect_file(file: UploadFile, detector: DetectorDep):
        data = file.file.read(settings.max_file_bytes + 1)
        if len(data) > settings.max_file_bytes:
            limit_kb = settings.max_file_bytes // 1000
            raise HTTPException(413, f"File is too large. The limit is {limit_kb} KB.")
        filename = file.filename or "upload.txt"
        try:
            text = extract_text(filename, data)
        except FileError as exc:
            raise HTTPException(400, str(exc)) from exc
        if not text:
            raise HTTPException(400, "No readable text found in that file.")
        return run_detection(text, detector, "file", filename)

    return app


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
app = create_app()
