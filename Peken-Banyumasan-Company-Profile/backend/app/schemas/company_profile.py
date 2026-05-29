"""Company profile section payload — opaque JSONB passthrough."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class CompanyProfileSectionResponse(BaseModel):
    """The public endpoint returns the raw `content` JSONB as the envelope
    `data`. This wrapper exists for typing only — the route emits the
    bare dict to match the OpenAPI example."""

    model_config = ConfigDict(extra="allow")

    content: dict[str, Any]
