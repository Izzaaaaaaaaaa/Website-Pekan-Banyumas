"""Canonical constants shared across all 4 Peken Banyumasan backends.

These mirror the frontend constants files exactly. If you change one, you
MUST change them everywhere AND re-run `bash db/verify_cross_consistency.sh`.
"""

from peken_common.constants.error_messages import ErrorMessages
from peken_common.constants.kategori_usaha import KATEGORI_USAHA, UMKM_9
from peken_common.constants.subsektor import BEKRAF_17, SUBSEKTOR

__all__ = [
    "BEKRAF_17",
    "KATEGORI_USAHA",
    "SUBSEKTOR",
    "UMKM_9",
    "ErrorMessages",
]
