"""Public event listing service."""

from __future__ import annotations

from datetime import date

from peken_common.lib.event_status import effective_event_status
from peken_common.lib.timezone import now_wib
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.event_repo import EventRepository
from app.schemas.event_public import EventPublic


def _to_public(row: object) -> EventPublic:
    """Serialize + replace status with the schedule-derived effective status so
    the public site shows akan-datang/berlangsung/selesai accurately (CP is
    read-only — no publish toggle relies on the raw value)."""
    e = EventPublic.model_validate(row)
    e.status = effective_event_status(
        e.status, e.tanggal, e.tanggal_selesai, e.jam_mulai, e.jam_selesai
    )
    return e


class PublicEventService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = EventRepository(session)

    async def list_events(
        self,
        *,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 20,
    ) -> list[EventPublic]:
        rows = await self.repo.list_public(
            status_filter=status, date_from=date_from, date_to=date_to, limit=limit
        )
        return [_to_public(r) for r in rows]

    async def list_upcoming(self, *, limit: int = 5) -> list[EventPublic]:
        today_wib = now_wib().date()
        rows = await self.repo.list_upcoming(today=today_wib, limit=limit)
        return [_to_public(r) for r in rows]
