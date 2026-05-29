"""Karya list service — enriches polymorphic owner with `owner` + `owner_slug`.

Two-step query strategy:
1. Repo returns Karya rows (no JOIN).
2. Service batch-fetches owners by (owner_type, owner_id) keys.
3. Service builds response Karya[] with the JOINed display info.

For high-traffic endpoints we'd switch to a single SQL CASE WHEN, but
public CP karya lists are short (limit 100 max) and low-traffic, so
clarity wins.
"""

from __future__ import annotations

from uuid import UUID

from peken_common.errors import BadRequestError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.artisan import Artisan
from app.domain.kolaborator import Kolaborator
from app.repositories.karya_repo import KaryaRepository
from app.schemas.karya import Karya as KaryaSchema
from app.schemas.karya import KaryaOwnerType


class PublicKaryaService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = KaryaRepository(session)

    async def list_karya(
        self,
        *,
        subsektor: str | None = None,
        featured: bool | None = None,
        kolaborator_id: UUID | None = None,
        artisan_id: UUID | None = None,
        limit: int = 20,
    ) -> list[KaryaSchema]:
        if kolaborator_id is not None and artisan_id is not None:
            raise BadRequestError(
                "Filter kolaborator_id dan artisan_id tidak boleh keduanya diisi bersamaan"
            )

        owner_type: str | None = None
        owner_id: UUID | None = None
        if kolaborator_id is not None:
            owner_type, owner_id = "kolaborator", kolaborator_id
        elif artisan_id is not None:
            owner_type, owner_id = "artisan", artisan_id

        karya_rows = await self.repo.list_filtered(
            subsektor=subsektor,
            featured=featured,
            owner_type=owner_type,
            owner_id=owner_id,
            limit=limit,
        )
        return await self._enrich(karya_rows)

    async def list_featured_by_owner(
        self, *, owner_type: str, owner_id: UUID, limit: int = 12
    ) -> list[KaryaSchema]:
        # `owner_type` is the plain "artisan"/"kolaborator" string (callers
        # pass `ProfileRole.<X>.value`); the repo filters the string column.
        rows = await self.repo.list_featured_by_owner(
            owner_type=owner_type, owner_id=owner_id, limit=limit
        )
        return await self._enrich(rows)

    # ------------------------------------------------------------------------
    # Polymorphic owner enrichment
    # ------------------------------------------------------------------------

    async def _enrich(self, rows: list) -> list[KaryaSchema]:
        if not rows:
            return []

        artisan_ids = {r.owner_id for r in rows if r.owner_type == "artisan"}
        kolab_ids = {r.owner_id for r in rows if r.owner_type == "kolaborator"}

        artisan_map: dict[UUID, tuple[str, str]] = {}
        if artisan_ids:
            stmt = select(Artisan.id, Artisan.nama_usaha, Artisan.slug).where(
                Artisan.id.in_(artisan_ids)
            )
            for aid, nama, slug in (await self.session.execute(stmt)).all():
                artisan_map[aid] = (nama, slug)

        kolab_map: dict[UUID, tuple[str, str]] = {}
        if kolab_ids:
            stmt = select(Kolaborator.id, Kolaborator.nama, Kolaborator.slug).where(
                Kolaborator.id.in_(kolab_ids)
            )
            for kid, nama, slug in (await self.session.execute(stmt)).all():
                kolab_map[kid] = (nama, slug)

        result: list[KaryaSchema] = []
        for r in rows:
            owner_name, owner_slug = ("", "")
            if r.owner_type == "artisan" and r.owner_id in artisan_map:
                owner_name, owner_slug = artisan_map[r.owner_id]
            elif r.owner_type == "kolaborator" and r.owner_id in kolab_map:
                owner_name, owner_slug = kolab_map[r.owner_id]
            # Skip karya whose owner is missing or deleted (defense in depth).
            if not owner_name:
                continue
            result.append(
                KaryaSchema(
                    id=r.id,
                    judul=r.judul,
                    subsektor=r.subsektor,
                    deskripsi=r.deskripsi,
                    tahun=r.tahun,
                    gambar_url=r.gambar_url,
                    featured=r.featured,
                    owner_type=KaryaOwnerType(r.owner_type),
                    owner_id=r.owner_id,
                    owner=owner_name,
                    owner_slug=owner_slug,
                    created_at=r.created_at,
                    updated_at=r.updated_at,
                )
            )
        return result
