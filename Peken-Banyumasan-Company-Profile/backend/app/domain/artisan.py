"""ORM model for `public.artisans` (READ-ONLY in this backend).

Admin-only columns (`internal_notes`, `komisi_persen`, `total_penjualan`,
`komisi_terkumpul`, `no_hp`, `email`) are mapped but MUST NEVER be
projected into the public response schema (plan §24.5).
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Date, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.base import Base


class Artisan(Base):
    __tablename__ = "artisans"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)  # admin-only
    username: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    nama_usaha: Mapped[str] = mapped_column(Text, nullable=False, default="")
    pemilik: Mapped[str] = mapped_column(Text, nullable=False, default="")
    no_hp: Mapped[str] = mapped_column(Text, nullable=False, default="")  # admin-only
    kota: Mapped[str] = mapped_column(Text, nullable=False, default="")
    deskripsi: Mapped[str] = mapped_column(Text, nullable=False, default="")
    internal_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")  # admin-only
    foto_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    qris_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    qris_updated_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    kategori_usaha: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    komisi_persen: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=0
    )  # admin-only
    tanggal_daftar: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    total_penjualan: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=0
    )  # admin-only
    komisi_terkumpul: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=0
    )  # admin-only
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
