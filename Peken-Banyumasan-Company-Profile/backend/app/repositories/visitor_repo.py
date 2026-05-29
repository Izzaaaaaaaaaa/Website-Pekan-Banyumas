"""Visitor aggregate count — sole purpose for CP backend."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.visitor import Visitor


class VisitorRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def count_total(self) -> int:
        """Cumulative ENTRIES across all editions.

        Append-only model: each visit is a `di_dalam` (masuk) row plus, on exit,
        a separate `keluar` row. Counting every row double-counts each visitor,
        so we count only entries (`di_dalam`).
        """
        stmt = (
            select(func.count())
            .select_from(Visitor)
            .where(Visitor.status == "di_dalam")
        )
        return int((await self.session.scalar(stmt)) or 0)
