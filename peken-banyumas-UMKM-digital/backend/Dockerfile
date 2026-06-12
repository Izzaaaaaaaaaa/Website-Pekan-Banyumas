# syntax=docker/dockerfile:1
# ============================================================================
# UMKM / Artisan Backend — STANDALONE
#   Tanpa peken_common. Build context = FOLDER INI (backend/), bukan repo root.
#     docker build -t peken-umkm-api .
#     docker run --rm -p 8004:8000 --env-file .env peken-umkm-api
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

# Backend ini tidak punya /health — root "/" dipakai sebagai liveness.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
    CMD curl -fsS "http://localhost:${PORT:-8000}/" || exit 1

# $PORT diinject Railway/Render otomatis; fallback 8000 untuk lokal/compose.
# Shell form supaya ${PORT} terekspansi; `exec` menjadikan uvicorn PID 1
# agar sinyal SIGTERM (shutdown/restart) diterima langsung & bersih.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
