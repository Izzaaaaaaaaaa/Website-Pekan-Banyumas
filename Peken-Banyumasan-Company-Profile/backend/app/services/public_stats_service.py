"""Aggregate landing-page stats service."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.artisan_repo import ArtisanRepository
from app.repositories.event_repo import EventRepository
from app.repositories.kolaborator_repo import KolaboratorRepository
from app.repositories.visitor_repo import VisitorRepository
from app.schemas.public_stats import PublicStats


class PublicStatsService:
    def __init__(self, session: AsyncSession) -> None:
        self.artisan_repo = ArtisanRepository(session)
        self.kolab_repo = KolaboratorRepository(session)
        self.event_repo = EventRepository(session)
        self.visitor_repo = VisitorRepository(session)

    async def get(self) -> PublicStats:
        artisan_aktif = await self.artisan_repo.count_aktif()
        kolab_aktif = await self.kolab_repo.count_aktif()
        edisi = await self.event_repo.count_selesai_or_later()
        pengunjung = await self.visitor_repo.count_total()
        return PublicStats(
            edisi_count=edisi,
            kolaborator_aktif=kolab_aktif,
            artisan_aktif=artisan_aktif,
            pengunjung_total=pengunjung,
        )
