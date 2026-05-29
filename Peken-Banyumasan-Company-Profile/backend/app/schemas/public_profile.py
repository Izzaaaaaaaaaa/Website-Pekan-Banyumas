"""Public profile schema — sanitized for `/api/public/profiles/{slug}`.

Critical contract (plan §24.5 / openapi-companyprof.yaml line 642):
> MUST NOT contain email, no_hp, or financial fields.

Any future field addition to this schema MUST be reviewed against the
admin-only list. Re-run `bash db/audit_admin_only_leaks.sh` to verify.
"""

from __future__ import annotations

from datetime import date, time
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.karya import Karya
from app.schemas.story import Story


class ProfileRole(StrEnum):
    ARTISAN = "artisan"
    KOLABORATOR = "kolaborator"


class ProfileEvent(BaseModel):
    """One event the profile has joined (published+ only — drafts excluded)."""

    model_config = ConfigDict(extra="ignore")

    id: UUID
    nama: str
    tanggal: date
    tanggal_selesai: date | None = None
    jam_mulai: time | None = None
    jam_selesai: time | None = None
    lokasi: str = ""
    deskripsi: str = ""
    status: str
    peran: str | None = None  # kolaborator role chip; None for artisan


class PublicProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    slug: str
    nama: str
    role: ProfileRole
    kota: str
    bio: str  # mirrors `kolaborators.bio` or `artisans.deskripsi`
    foto_url: str | None = None
    cover_url: str | None = None
    # For kolaborator: BEKRAF subsektor. For artisan: UMKM kategori_usaha.
    # Both come through as list[str] to keep the schema simple for FE.
    subsektor: list[str] = []
    karya: list[Karya] = []
    story: list[Story] = []
    events: list[ProfileEvent] = []
    # Real totals (computed fresh, not the drifting kolaborators.total_* cols).
    total_karya: int = 0
    total_story: int = 0
    total_event: int = 0
