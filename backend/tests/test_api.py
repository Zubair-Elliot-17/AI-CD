# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import io
from pathlib import Path

import docx
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

HUMAN = "My grandmother grew tomatoes in old paint tins on the balcony every single summer."
AI = "In this essay we will delve into the rich tapestry of urban gardening and its benefits."
FIXTURES = Path(__file__).parent / "TestFiles"


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert ".pdf" in body["supported_extensions"]


def test_detect_human_text(client):
    res = client.post("/api/detect", json={"text": HUMAN})
    assert res.status_code == 200
    body = res.json()
    assert body["verdict"] == "human"
    assert body["source"] == "text"
    assert body["model"] == "fake-detector"
    assert body["sentences"][0]["text"] == HUMAN


def test_detect_ai_text(client):
    body = client.post("/api/detect", json={"text": AI}).json()
    assert body["verdict"] == "ai"
    assert body["ai_probability"] > 0.9


def test_rejects_short_text(client):
    res = client.post("/api/detect", json={"text": "too short"})
    assert res.status_code == 400
    assert "at least 10 words" in res.json()["detail"]


def test_rejects_long_text(client, settings):
    res = client.post("/api/detect", json={"text": "word " * (settings.max_chars // 4)})
    assert res.status_code == 400


def test_detect_txt_file(client):
    res = client.post("/api/detect/file", files={"file": ("essay.txt", AI.encode(), "text/plain")})
    assert res.status_code == 200
    assert res.json()["filename"] == "essay.txt"
    assert res.json()["source"] == "file"


def test_detect_docx_file(client):
    document = docx.Document()
    document.add_paragraph(HUMAN)
    buf = io.BytesIO()
    document.save(buf)
    res = client.post("/api/detect/file", files={"file": ("essay.docx", buf.getvalue())})
    assert res.status_code == 200
    assert res.json()["text"] == HUMAN


def test_detect_fixture_files(client):
    for name in ("BatchTest.pdf", "BatchTest.docx"):
        data = (FIXTURES / name).read_bytes()
        res = client.post("/api/detect/file", files={"file": (name, data)})
        assert res.status_code == 200, (name, res.text)
        assert res.json()["word_count"] > 10


def test_rejects_unsupported_file(client):
    res = client.post("/api/detect/file", files={"file": ("virus.exe", b"MZ" * 100)})
    assert res.status_code == 400
    assert "Unsupported" in res.json()["detail"]


def test_rejects_corrupt_pdf(client):
    res = client.post("/api/detect/file", files={"file": ("bad.pdf", b"not really a pdf")})
    assert res.status_code == 400


def test_rejects_large_file(client, settings):
    big = b"a " * settings.max_file_bytes
    res = client.post("/api/detect/file", files={"file": ("big.txt", big)})
    assert res.status_code == 413


def test_rate_limit(detector):
    with TestClient(create_app(Settings(rate_limit_per_minute=2), detector)) as c:
        codes = [c.post("/api/detect", json={"text": HUMAN}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_cors_allows_configured_origin(client):
    res = client.options(
        "/api/detect",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert res.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_tampering_is_reported_and_undone(client):
    attacked = AI.replace("delve", "dеl​vе")  # Cyrillic е plus a zero-width space
    body = client.post("/api/detect", json={"text": attacked}).json()
    assert body["verdict"] == "ai"
    assert body["tampering"] == {"invisible_chars": 1, "homoglyphs": 2}
    assert "delve" in body["text"]


def test_clean_text_reports_no_tampering(client):
    body = client.post("/api/detect", json={"text": HUMAN}).json()
    assert body["tampering"] == {"invisible_chars": 0, "homoglyphs": 0}
