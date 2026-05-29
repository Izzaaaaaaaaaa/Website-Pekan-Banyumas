"""DB engine + session FastAPI dependency wiring.

Singleton engine + sessionmaker live at module scope; the dependency
yields a session per request, committing on success and rolling back
on exception (via `peken_common.db.session.session_scope`).

The engine is created lazily on first session request so unit tests
that don't touch the DB don't need `SUPABASE_DB_URL` set.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from peken_common.db import create_engine, make_sessionmaker, session_scope
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.config import settings

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def _get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Lazily build the engine + sessionmaker on first call."""
    global _engine, _sessionmaker
    if _sessionmaker is None:
        if not settings.SUPABASE_DB_URL:
            raise RuntimeError(
                "SUPABASE_DB_URL is not set. "
                "Configure it in `.env` before starting the server "
                "(or override `get_db_session` in tests)."
            )
        _engine = create_engine(
            settings.SUPABASE_DB_URL,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_POOL_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT_SECONDS,
        )
        _sessionmaker = make_sessionmaker(_engine)
    return _sessionmaker


async def get_db_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: per-request AsyncSession with auto commit/rollback."""
    async for session in session_scope(_get_sessionmaker()):
        yield session


async def dispose_engine() -> None:
    """Lifespan shutdown — release pool connections cleanly."""
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None
