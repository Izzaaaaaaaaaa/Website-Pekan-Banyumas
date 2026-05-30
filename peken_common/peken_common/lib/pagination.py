"""Pagination helpers — offset/limit normalization and clamping."""

from __future__ import annotations

from typing import NamedTuple

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class PageParams(NamedTuple):
    """Normalized pagination parameters.

    - `limit`: rows per page (1..MAX_PAGE_SIZE)
    - `offset`: SQL OFFSET (>=0)
    - `page`: 1-indexed page number (for echo back to clients)
    """

    limit: int
    offset: int
    page: int


def paginate_params(
    page: int | None = 1,
    page_size: int | None = DEFAULT_PAGE_SIZE,
) -> PageParams:
    """Normalize raw query params into safe (limit, offset, page) tuple.

    - `page < 1` → 1
    - `page_size < 1` → DEFAULT_PAGE_SIZE
    - `page_size > MAX_PAGE_SIZE` → MAX_PAGE_SIZE
    - None values fall back to defaults

        >>> paginate_params(1, 20)
        PageParams(limit=20, offset=0, page=1)
        >>> paginate_params(3, 50)
        PageParams(limit=50, offset=100, page=3)
        >>> paginate_params(0, 999)
        PageParams(limit=100, offset=0, page=1)
    """
    p = max(1, page or 1)
    ps = page_size if page_size and page_size > 0 else DEFAULT_PAGE_SIZE
    ps = min(ps, MAX_PAGE_SIZE)
    return PageParams(limit=ps, offset=(p - 1) * ps, page=p)
