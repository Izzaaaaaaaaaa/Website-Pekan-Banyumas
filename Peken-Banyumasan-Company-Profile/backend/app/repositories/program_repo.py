"""Program queries — public filter `aktif=true` ALWAYS enforced."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.program import Program


class ProgramRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_aktif(self) -> list[Program]:
        stmt = (
            select(Program)
            .where(Program.aktif.is_(True))
            .order_by(Program.urutan.asc(), Program.nama.asc())
        )
        return list((await self.session.scalars(stmt)).all())

    async def get_aktif_by_slug(self, slug: str) -> Program | None:
        stmt = select(Program).where(Program.slug == slug, Program.aktif.is_(True))
        return (await self.session.scalars(stmt)).one_or_none()
