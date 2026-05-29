"""FastAPI app factory for the Company Profile public API.

Public CP is read-only and unauthenticated. CORS is permissive by
default; tighten via `CORS_ORIGINS` env var in production.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from peken_common.errors import register_exception_handlers
from peken_common.logging_setup import configure_logging
from peken_common.middleware import install_request_context_middleware, setup_cors

from app.api.v1.api_router import api_router
from app.config import settings
from app.core.dependencies import dispose_engine


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """App lifespan: configure logging at startup, dispose DB pool at shutdown."""
    configure_logging(settings.LOG_LEVEL)
    try:
        yield
    finally:
        await dispose_engine()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Peken Banyumasan — Company Profile API",
        version="2.3.0",
        description=(
            "Public read-only API consumed by the Company Profile marketing site. "
            "All endpoints under `/api/public/`. No authentication required."
        ),
        lifespan=lifespan,
        # OpenAPI served at /openapi.json; FE doesn't need it but keep enabled
        # for local debugging.
    )

    # CORS first so preflight responses don't go through request-context middleware.
    setup_cors(
        app,
        origins=settings.cors_origins_list(),
        allow_credentials=False,  # public read-only — no cookies needed
        methods=["GET", "OPTIONS"],
    )
    install_request_context_middleware(app)

    register_exception_handlers(app)
    app.include_router(api_router)

    return app


app = create_app()
