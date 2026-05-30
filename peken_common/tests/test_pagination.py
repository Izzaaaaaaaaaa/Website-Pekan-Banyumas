"""Tests for `paginate_params` and `PaginationMeta`."""

import pytest

from peken_common.lib.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, paginate_params
from peken_common.schemas.pagination import PaginationMeta


class TestPaginateParams:
    def test_first_page_default(self):
        p = paginate_params(1, DEFAULT_PAGE_SIZE)
        assert p.page == 1
        assert p.limit == DEFAULT_PAGE_SIZE
        assert p.offset == 0

    def test_third_page_size_50(self):
        p = paginate_params(3, 50)
        assert p.page == 3
        assert p.limit == 50
        assert p.offset == 100

    def test_clamps_page_to_min_1(self):
        p = paginate_params(0, 20)
        assert p.page == 1

    def test_clamps_negative_page(self):
        p = paginate_params(-5, 20)
        assert p.page == 1

    def test_clamps_page_size_to_max(self):
        p = paginate_params(1, 9999)
        assert p.limit == MAX_PAGE_SIZE

    def test_zero_page_size_falls_back_to_default(self):
        p = paginate_params(1, 0)
        assert p.limit == DEFAULT_PAGE_SIZE

    def test_none_falls_back(self):
        p = paginate_params(None, None)
        assert p.page == 1
        assert p.limit == DEFAULT_PAGE_SIZE


class TestPaginationMeta:
    def test_from_total_partial_last_page(self):
        meta = PaginationMeta.from_total(page=1, page_size=20, total=87)
        assert meta.total_pages == 5

    def test_from_total_exact_pages(self):
        meta = PaginationMeta.from_total(page=1, page_size=20, total=100)
        assert meta.total_pages == 5

    def test_from_total_zero(self):
        meta = PaginationMeta.from_total(page=1, page_size=20, total=0)
        assert meta.total_pages == 0

    def test_invalid_negative_total_rejected(self):
        with pytest.raises(Exception):  # noqa: B017 — pydantic ValidationError
            PaginationMeta(page=1, page_size=20, total=-1, total_pages=0)
