# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv

# Hugging Face Spaces runs containers as uid 1000.
RUN useradd -m -u 1000 app
USER app
WORKDIR /home/app/backend

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    HF_HOME=/home/app/.cache/huggingface \
    PATH="/home/app/backend/.venv/bin:$PATH"

COPY --chown=app pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project

# Bake the model weights into the image so cold starts don't download 500 MB.
ARG AICD_MODEL_ID=fakespot-ai/roberta-base-ai-text-detection-v1
ENV AICD_MODEL_ID=${AICD_MODEL_ID}
RUN python -c "import os; from huggingface_hub import snapshot_download; snapshot_download(os.environ['AICD_MODEL_ID'], allow_patterns=['*.json', '*.safetensors', '*.txt', 'merges.txt', 'vocab.*'])"

COPY --chown=app app ./app

ENV HF_HUB_OFFLINE=1
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--proxy-headers", "--forwarded-allow-ips", "*"]
