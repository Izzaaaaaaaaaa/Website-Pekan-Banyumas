"""Health check — pings the DB with `SELECT 1`.

Used by Docker HEALTHCHECK + Kubernetes/HF Space readiness probes.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_db_session

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(session: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    """Returns 200 if DB is reachable; raises 500 otherwise."""
    await session.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "2.4.0",
    }
