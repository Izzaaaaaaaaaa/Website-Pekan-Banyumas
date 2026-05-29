"""Public profile service — sanitized projection of artisan OR kolaborator.

Tries kolaborator first (slug uniqueness across both tables is enforced
at the DB level; if both happen to match the slug, kolaborator wins).
"""

from __future__ import annotations

from uuid import UUID

from peken_common.constants.error_messages import ErrorMessages
from peken_common.errors import NotFoundError
from peken_common.lib.event_status import effective_event_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.artisan import Artisan
from app.domain.kolaborator import Kolaborator
from app.repositories.artisan_repo import ArtisanRepository
from app.repositories.event_repo import EventRepository
from app.repositories.kolaborator_repo import KolaboratorRepository
from app.repositories.story_repo import StoryRepository
from app.schemas.public_profile import ProfileEvent, ProfileRole, PublicProfile
from app.schemas.story import Story as StorySchema
from app.services.public_karya_service import PublicKaryaService


class PublicProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.artisan_repo = ArtisanRepository(session)
        self.kolab_repo = KolaboratorRepository(session)
        self.story_repo = StoryRepository(session)
        self.event_repo = EventRepository(session)
        self.karya_service = PublicKaryaService(session)

    async def get_by_slug(self, slug: str) -> PublicProfile:
        kolab = await self.kolab_repo.get_aktif_by_slug(slug)
        if kolab is not None:
            return await self._project_kolaborator(kolab)
        artisan = await self.artisan_repo.get_aktif_by_slug(slug)
        if artisan is not None:
            return await self._project_artisan(artisan)
        raise NotFoundError(ErrorMessages.PROFILE_NOT_FOUND)

    # ------------------------------------------------------------------------
    # Projections (sanitized — see plan §24.5)
    # ------------------------------------------------------------------------

    async def _events_for(self, *, role: ProfileRole, owner_id: UUID) -> list[ProfileEvent]:
        rows = await self.event_repo.list_joined_by_owner(
            role=role.value, owner_id=owner_id
        )
        out: list[ProfileEvent] = []
        for r in rows:
            ev = ProfileEvent.model_validate(r)
            # Show schedule-derived status (akan datang/berlangsung/selesai).
            ev.status = effective_event_status(
                ev.status, ev.tanggal, ev.tanggal_selesai, ev.jam_mulai, ev.jam_selesai
            )
            out.append(ev)
        return out

    async def _project_kolaborator(self, k: Kolaborator) -> PublicProfile:
        # All karya (not just featured) so the tab count == the indicator count.
        karya = await self.karya_service.list_karya(
            kolaborator_id=k.id, limit=100
        )
        stories_orm = await self.story_repo.list_aktif_by_author(
            author_type="kolaborator", author_id=k.id
        )
        events = await self._events_for(role=ProfileRole.KOLABORATOR, owner_id=k.id)
        stories = [StorySchema.model_validate(s) for s in stories_orm]
        return PublicProfile(
            id=k.id,
            slug=k.slug,
            nama=k.nama,
            role=ProfileRole.KOLABORATOR,
            kota=k.kota,
            bio=k.bio,
            foto_url=k.foto_url,
            cover_url=k.cover_url,
            subsektor=list(k.subsektor or []),
            karya=karya,
            story=stories,
            events=events,
            total_karya=len(karya),
            total_story=len(stories),
            total_event=len(events),
        )

    async def _project_artisan(self, a: Artisan) -> PublicProfile:
        karya = await self.karya_service.list_karya(artisan_id=a.id, limit=100)
        stories_orm = await self.story_repo.list_aktif_by_author(
            author_type="artisan", author_id=a.id
        )
        events = await self._events_for(role=ProfileRole.ARTISAN, owner_id=a.id)
        stories = [StorySchema.model_validate(s) for s in stories_orm]
        # For artisans: `bio` ← `deskripsi`, `subsektor` ← `kategori_usaha`
        # (FE rendering is the same regardless of role).
        return PublicProfile(
            id=a.id,
            slug=a.slug,
            nama=a.nama_usaha,
            role=ProfileRole.ARTISAN,
            kota=a.kota,
            bio=a.deskripsi,
            foto_url=a.foto_url,
            cover_url=a.cover_url,
            subsektor=list(a.kategori_usaha or []),
            karya=karya,
            story=stories,
            events=events,
            total_karya=len(karya),
            total_story=len(stories),
            total_event=len(events),
        )
