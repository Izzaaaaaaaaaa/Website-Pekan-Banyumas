"""ORM model for `public.kolaborators` (READ-ONLY in this backend).

Admin-only columns (`no_hp`, `internal_notes`, `email`) are mapped but
MUST NEVER be projected into the public response schema (plan §24.5).
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.base import Base


class Kolaborator(Base):
    __tablename__ = "kolaborators"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)  # admin-only
    nama: Mapped[str] = mapped_column(Text, nullable=False, default="")
    kota: Mapped[str] = mapped_column(Text, nullable=False, default="")
    bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    no_hp: Mapped[str] = mapped_column(Text, nullable=False, default="")  # admin-only
    internal_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")  # admin-only
    foto_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    subsektor: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    tanggal_daftar: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    total_karya: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_story: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_event: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    slug: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
