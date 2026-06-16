"""Karya queries — polymorphic owner JOIN handled in the SERVICE layer."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.karya import Karya


class KaryaRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_filtered(
        self,
        *,
        subsektor: str | None = None,
        featured: bool | None = None,
        owner_type: str | None = None,
        owner_id: UUID | None = None,
        limit: int = 20,
    ) -> list[Karya]:
        # Public surfaces only ever show admin-visible karya.
        stmt = select(Karya).where(Karya.tampil.is_(True))
        if subsektor:
            stmt = stmt.where(Karya.subsektor == subsektor)
        if featured is not None:
            stmt = stmt.where(Karya.featured == featured)
        if owner_type:
            stmt = stmt.where(Karya.owner_type == owner_type)
        if owner_id is not None:
            stmt = stmt.where(Karya.owner_id == owner_id)
        stmt = stmt.order_by(Karya.featured.desc(), Karya.created_at.desc()).limit(limit)
        return list((await self.session.scalars(stmt)).all())

    async def list_featured_by_owner(
        self, *, owner_type: str, owner_id: UUID, limit: int = 12
    ) -> list[Karya]:
        """Used by `/api/public/profiles/{slug}` to embed featured karya."""
        stmt = (
            select(Karya)
            .where(
                Karya.owner_type == owner_type,
                Karya.owner_id == owner_id,
                Karya.tampil.is_(True),  # hidden karya never surface publicly
            )
            .order_by(Karya.featured.desc(), Karya.created_at.desc())
            .limit(limit)
        )
        return list((await self.session.scalars(stmt)).all())
