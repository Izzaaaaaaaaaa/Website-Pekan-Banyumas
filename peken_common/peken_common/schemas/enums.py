"""Canonical string enums + value-whitelist validators.

ALL enums here MUST match `db/schema.sql` CHECK constraints exactly.
See plan Section 24.4 for the authoritative catalog. When the DB enum
changes, update this file AND `db/schema.sql` AND run
`bash db/verify_cross_consistency.sh`.

Two validator types `KategoriUsahaList` / `SubsektorList` enforce the
canonical 9- and 17-value whitelists at request boundary. `SubsektorStr`
enforces the singular-string variant used by `karya.subsektor`.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Annotated

from pydantic import BeforeValidator

from peken_common.constants.error_messages import ErrorMessages
from peken_common.constants.kategori_usaha import UMKM_9
from peken_common.constants.subsektor import BEKRAF_17

# ---------------------------------------------------------------------------
# Role / status enums (mirror DB CHECK constraints)
# ---------------------------------------------------------------------------


class UserRole(StrEnum):
    """`users_profile.role` — also asserted by `jwt_role()` RLS helper."""

    ADMIN = "admin"
    PETUGAS = "petugas"
    ARTISAN = "artisan"
    KOLABORATOR = "kolaborator"


class UserStatus(StrEnum):
    """Account status (mirrored in JWT `app_metadata.status`).

    `disabled` is petugas-specific (set via Supabase `banned_until`); other
    roles use `aktif|pending|suspended|rejected`.
    """

    AKTIF = "aktif"
    PENDING = "pending"
    SUSPENDED = "suspended"
    REJECTED = "rejected"
    DISABLED = "disabled"


# ---------------------------------------------------------------------------
# Event domain
# ---------------------------------------------------------------------------


class EventStatus(StrEnum):
    """`events.status`. NEVER use `mendatang` (legacy spec bug — fixed in v2.2)."""

    DRAFT = "draft"
    PUBLISHED = "published"
    BERLANGSUNG = "berlangsung"
    SELESAI = "selesai"


class StatusRequest(StrEnum):
    """`artisan_requests.status_request` + `event_artisans.status_request`."""

    PENDING = "pending"
    PENDING_CHANGE = "pending_change"
    APPROVED = "approved"
    REJECTED = "rejected"


class StatusKehadiran(StrEnum):
    """`event_kolaborators.status_kehadiran`."""

    TERDAFTAR = "terdaftar"
    HADIR = "hadir"
    TIDAK_HADIR = "tidak_hadir"
    DIBATALKAN = "dibatalkan"


class Peran(StrEnum):
    """`event_kolaborators.peran`."""

    PERFORMER = "performer"
    PANITIA = "panitia"
    PESERTA = "peserta"


class KolaboratorRequestStatus(StrEnum):
    """`kolaborator_requests.status` (no `pending_change` variant)."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AssignedBy(StrEnum):
    """`event_artisans.assigned_by` / `event_kolaborators.assigned_by`."""

    ADMIN = "admin"
    SELF = "self"


# ---------------------------------------------------------------------------
# Polymorphic ownership (Karya / Stories)
# ---------------------------------------------------------------------------


class OwnerType(StrEnum):
    """`karya.owner_type`."""

    ARTISAN = "artisan"
    KOLABORATOR = "kolaborator"


class AuthorType(StrEnum):
    """`stories.author_type` (same values as OwnerType but separate concept)."""

    ARTISAN = "artisan"
    KOLABORATOR = "kolaborator"


class StoryStatus(StrEnum):
    """`stories.status` (soft-delete via `dihapus`)."""

    AKTIF = "aktif"
    DIHAPUS = "dihapus"
    DISEMBUNYIKAN = "disembunyikan"


# ---------------------------------------------------------------------------
# Financial (Kas)
# ---------------------------------------------------------------------------


class KasMetode(StrEnum):
    """`kas.metode` — `transfer` DROPPED in v2.2.2 (FE never sent it)."""

    TUNAI = "tunai"
    QRIS = "qris"


class KasJenis(StrEnum):
    """`kas.jenis`."""

    MASUK = "masuk"
    KELUAR = "keluar"


# ---------------------------------------------------------------------------
# Gate (Visitors)
# ---------------------------------------------------------------------------


class VisitorStatus(StrEnum):
    """`visitors.status` — `di_dalam` while inside, `keluar` after tap-out."""

    DI_DALAM = "di_dalam"
    KELUAR = "keluar"


# ---------------------------------------------------------------------------
# Auth (OTP)
# ---------------------------------------------------------------------------


class OtpPurpose(StrEnum):
    """`otp_codes.purpose`."""

    PASSWORD_RESET = "password_reset"
    VERIFY = "verify"
    REGISTER = "register"


# ---------------------------------------------------------------------------
# Company Profile sections
# ---------------------------------------------------------------------------


class CpSection(StrEnum):
    """`company_profile_sections.section` — fixed set of 6."""

    HOME = "home"
    ABOUT = "about"
    TIM = "tim"
    PROGRAMS = "programs"
    WORKS = "works"
    GALLERY = "gallery"


# ---------------------------------------------------------------------------
# Validators — enforce canonical 9/17 whitelists at request boundary
# ---------------------------------------------------------------------------


def _validate_kategori_list(values: object) -> list[str]:
    if not isinstance(values, list):
        raise ValueError(f"{ErrorMessages.INVALID_KATEGORI}: expected list of strings")
    bad = [v for v in values if not isinstance(v, str) or v not in UMKM_9]
    if bad:
        raise ValueError(f"{ErrorMessages.INVALID_KATEGORI}: {bad}")
    return values  # type: ignore[return-value]


def _validate_subsektor_list(values: object) -> list[str]:
    if not isinstance(values, list):
        raise ValueError(f"{ErrorMessages.INVALID_SUBSEKTOR}: expected list of strings")
    bad = [v for v in values if not isinstance(v, str) or v not in BEKRAF_17]
    if bad:
        raise ValueError(f"{ErrorMessages.INVALID_SUBSEKTOR}: {bad}")
    return values  # type: ignore[return-value]


def _validate_subsektor_str(value: object) -> str:
    if not isinstance(value, str) or value not in BEKRAF_17:
        raise ValueError(f"{ErrorMessages.INVALID_SUBSEKTOR}: {value!r}")
    return value


# Pydantic-friendly typed aliases (use as field types directly).
KategoriUsahaList = Annotated[list[str], BeforeValidator(_validate_kategori_list)]
SubsektorList = Annotated[list[str], BeforeValidator(_validate_subsektor_list)]
SubsektorStr = Annotated[str, BeforeValidator(_validate_subsektor_str)]
