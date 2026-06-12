# syntax=docker/dockerfile:1
# ============================================================================
# Kolaborator Backend — STANDALONE
#   Tanpa peken_common. Build context = FOLDER INI (backend/), bukan repo root.
#     docker build -t peken-kolaborator-api .
#     docker run --rm -p 8003:8000 --env-file .env peken-kolaborator-api
# ============================================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY app ./app

EXPOSE 8000

# Kolaborator: tidak ada /health, root "/" dipakai sebagai liveness
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
    CMD curl -fsS "http://localhost:${PORT:-8000}/" || exit 1

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
