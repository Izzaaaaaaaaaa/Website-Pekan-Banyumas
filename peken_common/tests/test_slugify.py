"""Tests for `slugify` helper."""

import pytest

from peken_common.lib.slugify import slugify


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("Warung Tegal Bahagia", "warung-tegal-bahagia"),
        ("Warung Tegal Bahagia!", "warung-tegal-bahagia"),
        ("Kopi & Susu", "kopi-susu"),
        ("Multiple   spaces", "multiple-spaces"),
        ("Trailing-Hyphens---", "trailing-hyphens"),
        ("---Leading", "leading"),
        ("ABC123", "abc123"),
        ("F&B / Kuliner", "f-b-kuliner"),
        ("Café Banyumas", "cafe-banyumas"),
        ("Naïve", "naive"),
        ("São Paulo", "sao-paulo"),
        # Empty / whitespace-only
        ("", ""),
        ("   ", ""),
        ("---", ""),
        ("!!!", ""),
        # Numbers preserved
        ("Toko 24 Jam", "toko-24-jam"),
        # Unicode that doesn't map to ASCII drops out
        ("中文 only", "only"),
    ],
)
def test_slugify(source: str, expected: str) -> None:
    assert slugify(source) == expected


def test_slugify_idempotent():
    once = slugify("Warung Tegal Bahagia!")
    twice = slugify(once)
    assert once == twice == "warung-tegal-bahagia"
