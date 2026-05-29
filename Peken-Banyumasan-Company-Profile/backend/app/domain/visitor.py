"""ORM model for `public.visitors` (READ-ONLY in this backend; used for aggregate count only).

Public CP only reads `COUNT(*)` for the `pengunjung_total` stat —
individual rows are NEVER returned via this backend.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.base import Base


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    event_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    nama: Mapped[str] = mapped_column(Text, nullable=False, default="Tamu")
    uid: Mapped[str | None] = mapped_column(Text, nullable=True)
    waktu_masuk: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    waktu_keluar: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="di_dalam")
