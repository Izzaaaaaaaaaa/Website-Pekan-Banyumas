"""Timezone helpers — WIB (Western Indonesia Time, UTC+7) and UTC.

Per plan Section 24.12:
- TIMESTAMPTZ columns → store/transmit UTC (ISO 8601, with `Z` suffix or `+00:00`)
- DATE columns (`tanggal`, `tanggal_daftar`) → WIB local `YYYY-MM-DD`, do NOT convert
- TIME columns (`jam_mulai`, `jam_selesai`) → WIB local 24-hour `HH:MM`

When you receive a `datetime` from the DB it is always timezone-aware UTC
(asyncpg + TIMESTAMPTZ guarantees this). When emitting to the wire, keep
it UTC unless the field is explicitly a "local WIB" date/time.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone, tzinfo

# WIB = UTC+7, no DST.
WIB: tzinfo = timezone(offset=timedelta(hours=7), name="WIB")


def now_utc() -> datetime:
    """Current time as timezone-aware UTC datetime."""
    return datetime.now(UTC)


def now_wib() -> datetime:
    """Current time as timezone-aware WIB datetime (UTC+7)."""
    return datetime.now(WIB)


def to_utc(dt: datetime) -> datetime:
    """Convert any timezone-aware datetime to UTC.

    Naive datetimes are rejected (raises ValueError) — be explicit about TZ.
    """
    if dt.tzinfo is None:
        raise ValueError("Cannot convert naive datetime to UTC; attach a tzinfo first")
    return dt.astimezone(UTC)


def to_wib(dt: datetime) -> datetime:
    """Convert any timezone-aware datetime to WIB.

    Naive datetimes are rejected (raises ValueError).
    """
    if dt.tzinfo is None:
        raise ValueError("Cannot convert naive datetime to WIB; attach a tzinfo first")
    return dt.astimezone(WIB)
