"""BEKRAF 17 — canonical subsektor values for `kolaborators.subsektor[]`,
`events.subsektor[]`, and `karya.subsektor` (SINGULAR string, not array).

Mirrors `*/frontend/src/constants/subsektor.js`. Order matters (used for
display in FE select boxes); do not sort.

Invariant: kolaborators/events/karya ONLY use this list; artisans ONLY use
UMKM_9. Never alias one as the other — see plan Section 24.1.
"""

from typing import Final

SUBSEKTOR: Final[tuple[str, ...]] = (
    "Kuliner",
    "Kriya",
    "Fashion",
    "Musik",
    "Seni Pertunjukan",
    "Film & Animasi",
    "Fotografi",
    "Desain Produk",
    "Arsitektur",
    "Periklanan",
    "Penerbitan",
    "Seni Rupa",
    "Televisi & Radio",
    "Game",
    "Aplikasi Digital",
    "Riset & Pengembangan",
    "Lainnya",
)

# O(1) membership lookup for validators
BEKRAF_17: Final[frozenset[str]] = frozenset(SUBSEKTOR)

assert len(SUBSEKTOR) == 17, "BEKRAF 17 list must contain exactly 17 values"
assert len(BEKRAF_17) == 17, "BEKRAF 17 frozenset must contain exactly 17 unique values"
