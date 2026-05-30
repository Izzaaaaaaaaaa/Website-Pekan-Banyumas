"""UMKM 9 — canonical kategori_usaha values for `artisans.kategori_usaha[]`.

Mirrors `*/frontend/src/constants/kategoriUsaha.js`. Order matters (used for
display in FE select boxes); do not sort.

Invariant: artisans ONLY use this list; kolaborators/events ONLY use BEKRAF_17.
Never alias one as the other — see plan Section 24.1.
"""

from typing import Final

KATEGORI_USAHA: Final[tuple[str, ...]] = (
    "F&B / Kuliner",
    "Kriya",
    "Fashion",
    "Kosmetik",
    "Furnitur",
    "Aksesoris",
    "Pertanian",
    "Peternakan",
    "Lainnya",
)

# O(1) membership lookup for validators
UMKM_9: Final[frozenset[str]] = frozenset(KATEGORI_USAHA)

assert len(KATEGORI_USAHA) == 9, "UMKM 9 list must contain exactly 9 values"
assert len(UMKM_9) == 9, "UMKM 9 frozenset must contain exactly 9 unique values"
