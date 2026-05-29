"""Kolaborator queries for public CP. Filter `status='aktif'` ALWAYS enforced."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.kolaborator import Kolaborator


class KolaboratorRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_aktif_by_slug(self, slug: str) -> Kolaborator | None:
        stmt = select(Kolaborator).where(
            Kolaborator.slug == slug, Kolaborator.status == "aktif"
        )
        return (await self.session.scalars(stmt)).one_or_none()

    async def count_aktif(self) -> int:
        stmt = (
            select(func.count())
            .select_from(Kolaborator)
            .where(Kolaborator.status == "aktif")
        )
        return int((await self.session.scalar(stmt)) or 0)
