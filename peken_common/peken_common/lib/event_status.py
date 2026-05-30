"""Effective event status — single source of truth across all 4 apps.

The DB `events.status` column stores admin INTENT. Only two values are meant
to be set by hand:
  - `draft`     → hidden from the public / not yet live
  - `published` → live & scheduled

Whether a *published* event is upcoming / berlangsung / selesai is DERIVED
from its schedule (tanggal + jam) versus the current time — so every app
shows the same thing and nobody has to remember to flip a status. Any
non-draft DB status (`published`, `berlangsung`, `selesai`) is treated as
"published" intent and re-derived from the clock.

Returned values match `EventStatus`: draft | published | berlangsung | selesai
where `published` means "akan datang" (scheduled, not started yet).
"""

from __future__ import annotations

from datetime import date, datetime, time

from peken_common.lib.timezone import WIB, now_wib

_DRAFT = "draft"
_PUBLISHED = "published"
_BERLANGSUNG = "berlangsung"
_SELESAI = "selesai"


def _wib_dt(d: date, t: time | None, *, end: bool) -> datetime:
    """Combine a WIB-local date + time into an aware WIB datetime.

    Missing time defaults to start-of-day (`end=False`) or end-of-day
    (`end=True`) so an event with no jam still spans its whole date.
    """
    fallback = time(23, 59, 59) if end else time(0, 0, 0)
    return datetime.combine(d, t or fallback, tzinfo=WIB)


def effective_event_status(
    status: str,
    tanggal: date,
    tanggal_selesai: date | None = None,
    jam_mulai: time | None = None,
    jam_selesai: time | None = None,
    now: datetime | None = None,
) -> str:
    """Derive the status a user should SEE, from admin intent + the clock.

    - `draft` stays `draft` (admin hasn't published it).
    - otherwise: `published` (akan datang) before the start, `berlangsung`
      while inside [start, end], `selesai` after the end.
    """
    if status == _DRAFT:
        return _DRAFT

    current = now or now_wib()
    if current.tzinfo is None:
        current = current.replace(tzinfo=WIB)

    start = _wib_dt(tanggal, jam_mulai, end=False)
    end = _wib_dt(tanggal_selesai or tanggal, jam_selesai, end=True)

    if current < start:
        return _PUBLISHED
    if current <= end:
        return _BERLANGSUNG
    return _SELESAI


def is_event_live(
    status: str,
    tanggal: date,
    tanggal_selesai: date | None = None,
    jam_mulai: time | None = None,
    jam_selesai: time | None = None,
    now: datetime | None = None,
) -> bool:
    """True iff the event is effectively `berlangsung` right now.

    Used to gate visitor tap-in/out and any other "only while the event is
    running" action.
    """
    return (
        effective_event_status(
            status, tanggal, tanggal_selesai, jam_mulai, jam_selesai, now
        )
        == _BERLANGSUNG
    )
