# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Upload backend/ to a Hugging Face Docker Space. Usage: deploy_space.py <user/space>"""

import shutil
import sys
import tempfile
from pathlib import Path

from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parent.parent
SPACE_README = """---
title: AI Content Detector API
emoji: 🔍
colorFrom: purple
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
short_description: FastAPI backend for the AI Content Detector
---

Backend for [AI Content Detector](https://github.com/Zubair-Elliot-17/AI-CD).
Interactive API docs at `/docs`.
"""


def main(space_id: str) -> None:
    api = HfApi()
    api.create_repo(space_id, repo_type="space", space_sdk="docker", exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        stage = Path(tmp)
        shutil.copytree(
            ROOT / "backend",
            stage,
            dirs_exist_ok=True,
            ignore=shutil.ignore_patterns(
                ".venv", "__pycache__", ".pytest_cache", ".ruff_cache", "tests", "eval", ".env"
            ),
        )
        (stage / "README.md").write_text(SPACE_README)
        api.upload_folder(
            repo_id=space_id,
            repo_type="space",
            folder_path=stage,
            commit_message="Deploy from GitHub",
            delete_patterns=["*"],
        )
    print(f"Deployed to https://huggingface.co/spaces/{space_id}")


if __name__ == "__main__":
    main(sys.argv[1])
