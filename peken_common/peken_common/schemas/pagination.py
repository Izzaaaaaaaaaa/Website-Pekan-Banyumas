"""Pagination response wrapper.

Used by list endpoints that paginate. Example:

    GET /api/artisan/me/kas?page=2&page_size=20

    {
      "status": "success",
      "data": {
        "items": [...20 rows],
        "pagination": { "page": 2, "page_size": 20, "total": 87, "total_pages": 5 }
      }
    }
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PaginationMeta(BaseModel):
    """Pagination metadata (echoed back alongside items)."""

    model_config = ConfigDict(extra="forbid")

    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)

    @classmethod
    def from_total(cls, page: int, page_size: int, total: int) -> PaginationMeta:
        """Compute total_pages from total + page_size."""
        total_pages = (total + page_size - 1) // page_size if page_size else 0
        return cls(page=page, page_size=page_size, total=total, total_pages=total_pages)


class PaginatedResponse[T](BaseModel):
    """Generic paginated payload (items + pagination meta)."""

    model_config = ConfigDict(extra="forbid")

    items: list[T]
    pagination: PaginationMeta
