# syntax=docker/dockerfile:1
# ============================================================================
# UMKM / Artisan Backend — STANDALONE
#   Tanpa peken_common. Build context = FOLDER INI (backend/), bukan repo root.
#     docker build -t peken-umkm-api .
#     docker run --rm -p 8004:8000 --env-file .env peken-umkm-api
#
#   CATATAN: Dockerfile lama (canonical: COPY peken_common + pyproject + gunicorn)
#   sudah TIDAK cocok dengan struktur tim (standalone, requirements.txt) → diganti.
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

# UMKM: tidak ada /health, root "/" (tag "Health") dipakai sebagai liveness
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
    CMD curl -fsS http://localhost:8000/ || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
