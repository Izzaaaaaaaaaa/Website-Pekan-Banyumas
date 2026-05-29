"""Public Event schema. `draft` status MUST NEVER appear here."""

from __future__ import annotations

from datetime import date, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: UUID
    nama: str
    tanggal: date  # WIB local YYYY-MM-DD
    tanggal_selesai: date
    jam_mulai: time  # WIB 24h HH:MM
    jam_selesai: time
    lokasi: str
    status: str  # 'published' | 'berlangsung' | 'selesai' only
    kapasitas: int | None = None
    deskripsi: str
    konten_lengkap: str | None = None
    subsektor: list[str] = []
    banner_url: str | None = None
    galeri: list[str] = []
