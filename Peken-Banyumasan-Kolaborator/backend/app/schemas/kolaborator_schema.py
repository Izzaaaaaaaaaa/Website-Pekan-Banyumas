from __future__ import annotations

from pydantic import BaseModel, EmailStr


class KolaboratorResponse(BaseModel):
    id: str
    slug: str | None = None
    email: EmailStr | None = None
    nama: str
    kota: str | None = None
    bio: str | None = None
    foto_url: str | None = None
    cover_url: str | None = None
    subsektor: list[str] = []

    status: str

    tanggal_daftar: str | None = None
    total_karya: int = 0
    total_story: int = 0
    total_event: int = 0


class DashboardStatsResponse(BaseModel):
    """Response schema untuk GET /api/dashboard/stats."""

    events_total: int
    stories_total: int
    my_karya: int | None = None
    my_story: int | None = None
    my_requests: int | None = None
