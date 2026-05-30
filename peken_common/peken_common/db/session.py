"""Async session scope — request-bound transaction lifecycle.

Each backend wires its own `get_db_session` FastAPI dependency on top of
`session_scope` so the framework injects the SessionLocal it owns. See
plan Section 7.1 for the per-app glue pattern.

    # app/core/dependencies.py
    from peken_common.db.session import session_scope
    from app.core.engine import SessionLocal

    async def get_db_session() -> AsyncIterator[AsyncSession]:
        async for s in session_scope(SessionLocal):
            yield s
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


async def session_scope(
    sessionmaker: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    """Yield a session, commit on success, rollback on any exception.

    Use via `async for` (it yields exactly once). Subsequent commits or
    rollbacks the caller performs inside the block are respected; this
    wrapper just ensures the outermost transaction is finalized.
    """
    async with sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


__all__ = ["session_scope"]
