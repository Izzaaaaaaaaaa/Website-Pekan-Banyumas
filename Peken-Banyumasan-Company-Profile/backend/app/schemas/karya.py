"""Karya response schema (public view).

`owner` and `owner_slug` are computed at read time via JOIN to either
`artisans` (nama_usaha + slug) or `kolaborators` (nama + slug) based on
`owner_type`. They are not stored in the karya row.

`subsektor` is a SINGULAR string (BEKRAF whitelist enforced).
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class KaryaOwnerType(StrEnum):
    ARTISAN = "artisan"
    KOLABORATOR = "kolaborator"


class Karya(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: UUID
    judul: str
    subsektor: str  # SINGULAR — BEKRAF whitelist
    deskripsi: str
    tahun: int
    gambar_url: str | None = None
    featured: bool = False
    owner_type: KaryaOwnerType
    owner_id: UUID
    owner: str  # JOINed: artisans.nama_usaha OR kolaborators.nama
    owner_slug: str  # JOINed: artisans.slug OR kolaborators.slug
    created_at: datetime | None = None
    updated_at: datetime | None = None
