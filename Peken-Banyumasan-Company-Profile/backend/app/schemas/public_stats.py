"""Aggregate landing-page stats — fully public, no sensitivity."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PublicStats(BaseModel):
    model_config = ConfigDict(extra="forbid")

    edisi_count: int = Field(ge=0)
    kolaborator_aktif: int = Field(ge=0)
    artisan_aktif: int = Field(ge=0)
    pengunjung_total: int = Field(ge=0)
