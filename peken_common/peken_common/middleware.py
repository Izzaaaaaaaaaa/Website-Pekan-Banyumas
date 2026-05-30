"""HTTP middleware + CORS setup (plan Section 10 & 11).

Two concerns:
1. `setup_cors(app, origins)` — install CORSMiddleware with explicit
   whitelist (or `["*"]` if the list is empty; documented per-backend).
2. `install_request_context_middleware(app)` — assign each request a
   `X-Request-Id` (echo the client's if present, else mint a UUID) and
   bind it into structlog contextvars so every log line in the request
   carries the same correlation id. Also logs `request` with latency_ms
   at end-of-request.
"""

from __future__ import annotations

import time
import uuid
from collections.abc import Awaitable, Callable

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

_logger = structlog.get_logger("peken.http")


def setup_cors(
    app: FastAPI,
    origins: list[str],
    *,
    allow_credentials: bool = True,
    methods: list[str] | None = None,
) -> None:
    """Install CORSMiddleware on `app`.

    `origins` empty → fallback to `["*"]` (NOT allowed with credentials,
    so we coerce `allow_credentials=False` in that case to avoid the
    browser rejecting preflight).
    """
    effective_origins = origins or ["*"]
    effective_creds = allow_credentials and effective_origins != ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=effective_origins,
        allow_credentials=effective_creds,
        allow_methods=methods or ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
        expose_headers=["X-Request-Id"],
        max_age=600,
    )


def install_request_context_middleware(app: FastAPI) -> None:
    """Attach a per-request middleware that:

    1. Generates or echoes `X-Request-Id`.
    2. Binds it into structlog contextvars (along with method + path).
    3. Logs a structured `request` event at end-of-request with latency_ms.

    Call AFTER `setup_cors` so CORS preflight is handled before context
    middleware runs (preflight responses shouldn't be log-noise).
    """

    @app.middleware("http")
    async def _request_context(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        start = time.monotonic()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = round((time.monotonic() - start) * 1000, 2)
            _logger.exception("request_failed", latency_ms=elapsed_ms)
            raise

        elapsed_ms = round((time.monotonic() - start) * 1000, 2)
        _logger.info("request", status=response.status_code, latency_ms=elapsed_ms)
        response.headers["X-Request-Id"] = request_id
        return response


__all__ = ["install_request_context_middleware", "setup_cors"]
