"""Story queries — public filter `status='aktif'` ALWAYS enforced."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.story import Story


class StoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_aktif_by_author(
        self, *, author_type: str, author_id: UUID, limit: int = 5
    ) -> list[Story]:
        stmt = (
            select(Story)
            .where(
                Story.author_type == author_type,
                Story.author_id == author_id,
                Story.status == "aktif",
            )
            .order_by(Story.created_at.desc())
            .limit(limit)
        )
        return list((await self.session.scalars(stmt)).all())
