"""Tests for the effective event-status helper."""

from datetime import date, datetime, time

from peken_common.lib.event_status import effective_event_status, is_event_live
from peken_common.lib.timezone import WIB

# A 3-day event: 2026-05-01 09:00 → 2026-05-03 20:00 WIB.
_T0 = date(2026, 5, 1)
_T1 = date(2026, 5, 3)
_START = time(9, 0)
_END = time(20, 0)


def _now(y, mo, d, h=12, mi=0):
    return datetime(y, mo, d, h, mi, tzinfo=WIB)


def test_draft_always_draft():
    # Even mid-window, a draft stays hidden.
    assert (
        effective_event_status("draft", _T0, _T1, _START, _END, _now(2026, 5, 2))
        == "draft"
    )


def test_before_start_is_published():
    assert (
        effective_event_status("published", _T0, _T1, _START, _END, _now(2026, 4, 30))
        == "published"
    )
    # Same day, before jam_mulai.
    assert (
        effective_event_status("published", _T0, _T1, _START, _END, _now(2026, 5, 1, 8))
        == "published"
    )


def test_inside_window_is_berlangsung():
    assert (
        effective_event_status("published", _T0, _T1, _START, _END, _now(2026, 5, 2))
        == "berlangsung"
    )
    assert is_event_live("published", _T0, _T1, _START, _END, _now(2026, 5, 2))


def test_after_end_is_selesai():
    assert (
        effective_event_status("published", _T0, _T1, _START, _END, _now(2026, 5, 3, 21))
        == "selesai"
    )
    assert (
        effective_event_status("published", _T0, _T1, _START, _END, _now(2026, 5, 9))
        == "selesai"
    )


def test_stale_db_status_is_re_derived():
    # DB says berlangsung but the event ended days ago → selesai.
    assert (
        effective_event_status("berlangsung", _T0, _T1, _START, _END, _now(2026, 5, 9))
        == "selesai"
    )
    # DB says selesai but we're inside the window → berlangsung.
    assert (
        effective_event_status("selesai", _T0, _T1, _START, _END, _now(2026, 5, 2))
        == "berlangsung"
    )


def test_single_day_no_times_spans_whole_day():
    # No jam → spans the full date; mid-day on that date is live.
    assert is_event_live("published", _T0, None, None, None, _now(2026, 5, 1, 13))
    # Day after → selesai.
    assert (
        effective_event_status("published", _T0, None, None, None, _now(2026, 5, 2))
        == "selesai"
    )


def test_naive_now_treated_as_wib():
    naive = datetime(2026, 5, 2, 12, 0)  # no tzinfo
    assert (
        effective_event_status("published", _T0, _T1, _START, _END, naive)
        == "berlangsung"
    )
