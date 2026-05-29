"""Program response schema (public view)."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Program(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: UUID
    slug: str
    nama: str
    deskripsi: str
    konten: str = ""
    icon: str = ""
    icon_url: str | None = None
    urutan: int = 0
    aktif: bool = True
