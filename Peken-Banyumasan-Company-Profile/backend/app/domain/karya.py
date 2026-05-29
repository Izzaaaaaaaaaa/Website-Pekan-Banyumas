"""ORM model for `public.karya` — polymorphic owner (artisan OR kolaborator).

`subsektor` is a SINGULAR string (NOT array). `owner_type` + `owner_id`
together identify the owner; the service layer JOINs to resolve `owner`
display name and `owner_slug` on read.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.base import Base


class Karya(Base):
    __tablename__ = "karya"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    owner_type: Mapped[str] = mapped_column(String, nullable=False)  # 'artisan' | 'kolaborator'
    owner_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    judul: Mapped[str] = mapped_column(Text, nullable=False)
    subsektor: Mapped[str] = mapped_column(Text, nullable=False)  # SINGULAR
    deskripsi: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tahun: Mapped[int] = mapped_column(Integer, nullable=False)
    gambar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
