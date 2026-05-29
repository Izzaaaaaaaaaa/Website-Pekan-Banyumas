"""ORM model for `public.events` (READ-ONLY in this backend).

Public endpoints filter `status IN ('published', 'berlangsung', 'selesai')`
— draft events MUST NEVER be returned.
"""

from __future__ import annotations

from datetime import date, datetime, time
from uuid import UUID

from sqlalchemy import Date, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import ARRAY, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.base import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    nama: Mapped[str] = mapped_column(Text, nullable=False)
    tanggal: Mapped[date] = mapped_column(Date, nullable=False)
    tanggal_selesai: Mapped[date] = mapped_column(Date, nullable=False)
    jam_mulai: Mapped[time] = mapped_column(Time, nullable=False)
    jam_selesai: Mapped[time] = mapped_column(Time, nullable=False)
    lokasi: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    kapasitas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    peserta_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    deskripsi: Mapped[str] = mapped_column(Text, nullable=False, default="")
    konten_lengkap: Mapped[str | None] = mapped_column(Text, nullable=True)
    subsektor: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    banner_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    galeri: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
