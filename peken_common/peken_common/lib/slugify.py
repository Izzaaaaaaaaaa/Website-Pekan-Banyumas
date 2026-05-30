"""URL slug generator.

Mirrors the SQL slug trigger semantics for `artisans.slug` and
`kolaborators.slug`. The DB trigger (`trg_artisans_slug`,
`trg_kolaborators_slug`) is authoritative — this helper is for places
where the BE needs to PREVIEW a slug (e.g., uniqueness check before
insert, or migration scripts).

Algorithm (deterministic, matches DB lower(regexp_replace(...)) pattern):
1. NFKD-normalize and strip accents
2. lowercase
3. replace any run of non-alphanumeric with a single hyphen
4. trim leading/trailing hyphens
5. collapse multiple consecutive hyphens (already handled by step 3)
"""

from __future__ import annotations

import re
import unicodedata


def slugify(value: str) -> str:
    """Convert an arbitrary string to a URL-safe slug.

    Empty / whitespace-only input returns an empty string; the caller
    decides whether to substitute a fallback (e.g., UUID prefix).

        >>> slugify("Warung Tegal Bahagia!")
        'warung-tegal-bahagia'
        >>> slugify("Kopi & Susu")
        'kopi-susu'
        >>> slugify("   ")
        ''
        >>> slugify("Café Banyumas")
        'cafe-banyumas'
    """
    if not value:
        return ""

    # Strip accents: é → e, ñ → n, etc.
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")

    lower = ascii_only.lower()
    # Any non-alphanumeric run → single hyphen
    hyphenated = re.sub(r"[^a-z0-9]+", "-", lower)
    return hyphenated.strip("-")
