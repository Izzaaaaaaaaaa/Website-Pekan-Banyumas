"""ORM model for `public.company_profile_sections`.

`content` is opaque JSONB — the BE stores and returns as-is without
validation. The 6-section enum (home|about|tim|programs|works|gallery)
is enforced via Pydantic at the route layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.base import Base


class CompanyProfileSection(Base):
    __tablename__ = "company_profile_sections"

    section: Mapped[str] = mapped_column(String, primary_key=True)
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    updated_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
