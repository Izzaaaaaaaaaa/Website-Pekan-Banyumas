# syntax=docker/dockerfile:1.7
# ============================================================================
# Peken Banyumasan — Company Profile API (public, read-only)
#
# Build context MUST be the monorepo root so `peken_common/` is reachable:
#   docker build \
#     -f Peken-Banyumasan-Company-Profile/backend/Dockerfile \
#     -t peken-cp-api .
#
# The image is self-contained — peken_common and the backend's `app` package
# are installed into site-packages. The container exposes port 7860.
# ============================================================================

# ---- Builder stage ---------------------------------------------------------
FROM python:3.13-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /build

# peken_common comes first — backend's `peken-common` runtime dep resolves
# to this already-installed version, so pip never queries PyPI for it.
COPY peken_common /build/peken_common
COPY Peken-Banyumasan-Company-Profile/backend/pyproject.toml /build/backend/
COPY Peken-Banyumasan-Company-Profile/backend/app /build/backend/app

RUN pip install --upgrade pip \
    && pip install /build/peken_common \
    && pip install /build/backend


# ---- Runtime stage ---------------------------------------------------------
FROM python:3.13-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# curl is needed by HEALTHCHECK; non-root user `app` runs the server.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app \
    && useradd -r -g app -d /home/app -s /usr/sbin/nologin app \
    && mkdir -p /home/app \
    && chown -R app:app /home/app

COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

USER app
WORKDIR /home/app
EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
    CMD curl -fsS "http://localhost:${PORT:-7860}/health" || exit 1

# Public CP is read-only + light traffic → single uvicorn worker is enough.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
