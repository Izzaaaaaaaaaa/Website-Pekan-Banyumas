"""ORM model for `public.stories` — polymorphic author (artisan OR kolaborator).

Public endpoints filter `status='aktif'` only. `dihapus` rows are soft-
deleted; `disembunyikan` are admin-hidden.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.base import Base


class Story(Base):
    __tablename__ = "stories"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    author_type: Mapped[str] = mapped_column(String, nullable=False)
    author_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    konten: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String, nullable=False, default="aktif")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
