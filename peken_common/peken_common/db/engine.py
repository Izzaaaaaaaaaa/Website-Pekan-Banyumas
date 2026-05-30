"""SQLAlchemy AsyncEngine + sessionmaker factories.

CRITICAL — Supabase pooler note (plan Section 7.1, Section 23):
The pooler at port 6543 runs pgbouncer in transaction mode, which does
NOT support session-level prepared statements. asyncpg caches prepared
statements by default, so we MUST set `statement_cache_size=0` for any
DSN pointing at the pooler.

We detect this automatically: any DSN containing `pooler.supabase.com`
or port `6543` gets `statement_cache_size=0`. Override via the
`prepared_statement_cache` arg if you know better.
"""

from __future__ import annotations

import re

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

_POOLER_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"pooler\.supabase\.com", re.IGNORECASE),
    re.compile(r":6543\b"),
)


def _is_pooled_dsn(dsn: str) -> bool:
    return any(p.search(dsn) for p in _POOLER_PATTERNS)


def create_engine(
    dsn: str,
    *,
    pool_size: int = 10,
    max_overflow: int = 5,
    pool_timeout: int = 30,
    echo: bool = False,
    prepared_statement_cache: int | None = None,
) -> AsyncEngine:
    """Build an `AsyncEngine` for Supabase Postgres.

    Args:
        dsn: SQLAlchemy DSN, must use the `+asyncpg` driver
             (e.g. `postgresql+asyncpg://user:pwd@host:port/db`).
        pool_size: number of persistent pool connections.
        max_overflow: temporary connections beyond pool_size under load.
        pool_timeout: seconds to wait for a connection from the pool.
        echo: SQL echo to stdout (only for local debugging).
        prepared_statement_cache: explicit override. If None, auto-set to
            0 for pooler DSNs (pgbouncer transaction mode), default otherwise.

    The engine is async-safe and should be a process-wide singleton; do
    NOT create one per request.
    """
    if "+asyncpg" not in dsn:
        raise ValueError(
            f"DSN must use the +asyncpg driver (got: {dsn!r}). "
            "Example: postgresql+asyncpg://..."
        )

    if prepared_statement_cache is None:
        prepared_statement_cache = 0 if _is_pooled_dsn(dsn) else 100

    connect_args: dict[str, object] = {
        "statement_cache_size": prepared_statement_cache,
        # Identify ourselves in pg_stat_activity for ops.
        "server_settings": {"application_name": "peken-backend"},
    }

    return create_async_engine(
        dsn,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        pool_pre_ping=True,
        echo=echo,
        future=True,
        connect_args=connect_args,
    )


def make_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Build the per-engine sessionmaker.

    `expire_on_commit=False` means ORM objects stay usable after commit,
    matching the pattern in FastAPI dependencies that yield a session
    and commit on context exit.
    """
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


__all__ = ["create_engine", "make_sessionmaker"]
