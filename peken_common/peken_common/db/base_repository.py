"""Generic repository base — thin CRUD on top of SQLAlchemy AsyncSession.

Domain repositories inherit + add custom queries (JOINs, aggregates,
raw SQL via `text()`). Keep BUSINESS RULES out of repos — they live in
services. Repos only do DB I/O.

    class ArtisanRepository(BaseRepository[Artisan]):
        model = Artisan

        async def find_by_slug(self, slug: str) -> Artisan | None:
            stmt = select(Artisan).where(Artisan.slug == slug)
            return (await self.session.scalars(stmt)).one_or_none()
"""

from __future__ import annotations

from typing import Any, ClassVar

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepository[T]:
    """Generic CRUD base.

    Subclasses MUST set the `model` class attribute to their ORM model.

        class EventRepository(BaseRepository[Event]):
            model = Event
    """

    model: ClassVar[type]  # set on subclass; e.g., `model = Artisan`

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, id_: Any) -> T | None:
        """Primary-key lookup. Returns None if not found."""
        return await self.session.get(self.model, id_)  # type: ignore[return-value]

    async def list(self, **filters: Any) -> list[T]:
        """Filter-by-equality list. Use for simple filters only —
        anything more complex goes into a domain-specific method.
        """
        stmt: Any = select(self.model).filter_by(**filters)
        return list((await self.session.scalars(stmt)).all())

    async def create(self, **kwargs: Any) -> T:
        """Insert and `flush()` so PK is populated. Caller commits."""
        obj = self.model(**kwargs)  # type: ignore[call-arg]
        self.session.add(obj)
        await self.session.flush()
        return obj  # type: ignore[return-value]

    async def update(self, id_: Any, **kwargs: Any) -> T | None:
        """UPDATE ... WHERE id = id_ RETURNING *.

        Returns the updated row, or None if no row matched.
        """
        stmt: Any = (
            update(self.model)
            .where(self.model.id == id_)  # type: ignore[attr-defined]
            .values(**kwargs)
            .returning(self.model)
        )
        result = await self.session.scalars(stmt)
        return result.one_or_none()

    async def delete(self, id_: Any) -> bool:
        """Hard-delete by primary key. Returns True if a row was deleted.

        For soft-delete (stories), call `update(id_, status='dihapus')`
        instead.
        """
        stmt = delete(self.model).where(self.model.id == id_)  # type: ignore[attr-defined]
        result = await self.session.execute(stmt)
        return (result.rowcount or 0) > 0  # type: ignore[attr-defined]


__all__ = ["BaseRepository"]
