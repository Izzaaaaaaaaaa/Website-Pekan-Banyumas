"""DB access layer building blocks (SQLAlchemy 2.0 Async + asyncpg).

`engine.py` builds the AsyncEngine. `session.py` exposes the FastAPI
dependency `get_db_session()`. `base_repository.py` is a thin generic
CRUD base — repositories per backend extend it with domain queries.

Per-backend Glue (in `app/core/dependencies.py`):

    engine = create_engine(settings.SUPABASE_DB_URL, ...)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def get_db_session() -> AsyncIterator[AsyncSession]:
        async with SessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
"""

from peken_common.db.base_repository import BaseRepository
from peken_common.db.engine import create_engine, make_sessionmaker
from peken_common.db.session import session_scope

__all__ = ["BaseRepository", "create_engine", "make_sessionmaker", "session_scope"]
