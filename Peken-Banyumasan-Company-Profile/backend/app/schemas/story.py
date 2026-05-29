"""Story response schema (public view) — only `aktif` stories ever projected here."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Story(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: UUID
    konten: str
    media_url: str | None = None
    tags: list[str] = []
    like_count: int = 0
    status: str  # always 'aktif' when projected here
    created_at: datetime
