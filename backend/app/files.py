# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Text extraction for uploaded documents, done in memory (no temp files)."""

import io
from pathlib import PurePath

import docx
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf", ".docx"}


class FileError(ValueError):
    pass


def extract_text(filename: str, data: bytes) -> str:
    ext = PurePath(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise FileError("Unsupported file type. Upload a PDF, DOCX, TXT or MD file.")
    try:
        if ext == ".pdf":
            reader = PdfReader(io.BytesIO(data))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        elif ext == ".docx":
            document = docx.Document(io.BytesIO(data))
            text = "\n".join(p.text for p in document.paragraphs)
        else:
            text = _decode(data)
    except FileError:
        raise
    except Exception as exc:
        raise FileError(f"Couldn't read {ext[1:].upper()} file. Is it corrupted?") from exc
    return text.strip()


def _decode(data: bytes) -> str:
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return data.decode("cp1252", errors="replace")
