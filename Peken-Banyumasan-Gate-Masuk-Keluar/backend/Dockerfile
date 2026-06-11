# syntax=docker/dockerfile:1
# ============================================================================
# Gate (Admin & Petugas) Backend — STANDALONE
#   Tanpa peken_common. Build context = FOLDER INI (backend/), bukan repo root.
#     docker build -t peken-gate-api .
#     docker run --rm -p 8002:8000 --env-file .env peken-gate-api
# ============================================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# curl untuk healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install deps dulu (layer cache-friendly — tidak rebuild kalau cuma kode berubah)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Kode aplikasi
COPY app ./app

EXPOSE 8000

# Gate punya endpoint /health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
    CMD curl -fsS http://localhost:8000/health || exit 1

# Bind ke $PORT (Railway/Render inject otomatis) dengan default 8000 (lokal/compose)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
