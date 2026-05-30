"""Response envelope models (plan Section 24.11).

Every JSON response from every backend follows this shape:

    success: { "status": "success", "message": null|str, "data": <payload> }
    error:   { "status": "error",   "message": <str>,    "data": null,
               "errors": { "<field>": [<msg>, ...] } }

The single exception is binary download (reports/export endpoints) which
returns raw bytes with `Content-Disposition: attachment`.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Envelope[T](BaseModel):
    """Successful response wrapper."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["success"] = "success"
    message: str | None = None
    data: T | None = None


class ErrorEnvelope(BaseModel):
    """Error response wrapper. `errors` is populated for 422 validation errors."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["error"] = "error"
    message: str
    data: None = None
    errors: dict[str, list[str]] | None = Field(default=None)
