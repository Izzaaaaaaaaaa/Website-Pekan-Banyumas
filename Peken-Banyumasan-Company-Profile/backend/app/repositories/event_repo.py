"""Event queries for public CP. `draft` NEVER returned."""

from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from peken_common.lib.event_status import effective_event_status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.event import Event

_PUBLIC_STATUSES = ("published", "berlangsung", "selesai")
_UPCOMING_STATUSES = ("published", "berlangsung")

# Events a profile has JOINED — published+ only (drafts never leak publicly).
# kolaborator: every event_kolaborators row is a confirmed participation.
# artisan: only approved / pending_change rows count as participating.
_KOLAB_JOINED_SQL = text(
    """
    SELECT e.id, e.nama, e.tanggal, e.tanggal_selesai, e.jam_mulai,
           e.jam_selesai, e.lokasi, e.deskripsi, e.status, ek.peran
    FROM public.event_kolaborators ek
    JOIN public.events e ON e.id = ek.event_id
    WHERE ek.kolaborator_id = :pid AND e.status <> 'draft'
    ORDER BY e.tanggal DESC
    """
)
_ARTISAN_JOINED_SQL = text(
    """
    SELECT e.id, e.nama, e.tanggal, e.tanggal_selesai, e.jam_mulai,
           e.jam_selesai, e.lokasi, e.deskripsi, e.status, NULL AS peran
    FROM public.event_artisans ea
    JOIN public.events e ON e.id = ea.event_id
    WHERE ea.artisan_id = :pid AND ea.status_request IN ('approved', 'pending_change')
      AND e.status <> 'draft'
    ORDER BY e.tanggal DESC
    """
)


class EventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_public(
        self,
        *,
        status_filter: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 20,
    ) -> list[Event]:
        stmt = select(Event)
        if status_filter:
            if status_filter not in _PUBLIC_STATUSES:
                # Defense-in-depth — the route already validates via enum,
                # but if a future caller bypasses it we still refuse drafts.
                return []
            stmt = stmt.where(Event.status == status_filter)
        else:
            stmt = stmt.where(Event.status.in_(_PUBLIC_STATUSES))
        if date_from is not None:
            stmt = stmt.where(Event.tanggal >= date_from)
        if date_to is not None:
            stmt = stmt.where(Event.tanggal <= date_to)
        stmt = stmt.order_by(Event.tanggal.desc(), Event.created_at.desc()).limit(limit)
        return list((await self.session.scalars(stmt)).all())

    async def list_upcoming(self, *, today: date, limit: int = 5) -> list[Event]:
        stmt = (
            select(Event)
            .where(Event.status.in_(_UPCOMING_STATUSES), Event.tanggal_selesai >= today)
            .order_by(Event.tanggal.asc())
            .limit(limit)
        )
        return list((await self.session.scalars(stmt)).all())

    async def list_joined_by_owner(
        self, *, role: str, owner_id: UUID
    ) -> list[dict[str, Any]]:
        """Events the artisan/kolaborator participates in (published+ only)."""
        sql = _KOLAB_JOINED_SQL if role == "kolaborator" else _ARTISAN_JOINED_SQL
        result = await self.session.execute(sql, {"pid": owner_id})
        return [dict(r) for r in result.mappings().all()]

    async def count_selesai_or_later(self) -> int:
        """`edisi_count` — editions actually HELD (diselenggarakan).

        An edition counts once it has STARTED: effective status berlangsung
        (running now) or selesai (concluded). Future `published` events are NOT
        counted — otherwise "X edisi diselenggarakan" inflates with editions
        that haven't happened yet.
        """
        rows = (
            await self.session.scalars(
                select(Event).where(Event.status != "draft")
            )
        ).all()
        return sum(
            1
            for e in rows
            if effective_event_status(
                e.status, e.tanggal, e.tanggal_selesai, e.jam_mulai, e.jam_selesai
            )
            in ("berlangsung", "selesai")
        )
