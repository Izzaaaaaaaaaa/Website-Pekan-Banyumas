"""Tests for WIB timezone helpers."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from peken_common.lib.timezone import WIB, now_utc, now_wib, to_utc, to_wib


class TestWIB:
    def test_offset(self):
        # WIB is UTC+7, no DST
        offset = WIB.utcoffset(None)
        assert offset == timedelta(hours=7)

    def test_name(self):
        # tzname depends on the runtime; just check it's a known label.
        # zoneinfo wouldn't apply since we use a fixed-offset timezone.
        assert WIB.tzname(None) == "WIB"


class TestNow:
    def test_now_utc_is_aware(self):
        dt = now_utc()
        assert dt.tzinfo is not None
        assert dt.utcoffset() == timedelta(0)

    def test_now_wib_is_aware(self):
        dt = now_wib()
        assert dt.tzinfo is not None
        assert dt.utcoffset() == timedelta(hours=7)

    def test_now_utc_and_wib_align(self):
        u = now_utc()
        w = now_wib()
        # Wall-clock difference should be ~7 hours (or 17 hours backward, same instant).
        delta = (w.astimezone(UTC) - u).total_seconds()
        # Allow up to 1s drift between the two calls.
        assert abs(delta) < 1.0


class TestConvert:
    def test_to_utc_from_wib(self):
        wib_dt = datetime(2026, 5, 12, 15, 0, 0, tzinfo=WIB)
        utc_dt = to_utc(wib_dt)
        assert utc_dt.tzinfo == UTC
        # 15:00 WIB = 08:00 UTC
        assert utc_dt.hour == 8
        assert utc_dt.day == 12

    def test_to_wib_from_utc(self):
        utc_dt = datetime(2026, 5, 12, 8, 0, 0, tzinfo=UTC)
        wib_dt = to_wib(utc_dt)
        assert wib_dt.utcoffset() == timedelta(hours=7)
        assert wib_dt.hour == 15  # 8 + 7

    def test_to_utc_naive_rejected(self):
        naive = datetime(2026, 5, 12, 15, 0, 0)
        with pytest.raises(ValueError, match="naive"):
            to_utc(naive)

    def test_to_wib_naive_rejected(self):
        naive = datetime(2026, 5, 12, 8, 0, 0)
        with pytest.raises(ValueError, match="naive"):
            to_wib(naive)

    def test_roundtrip_through_other_tz(self):
        # Take an arbitrary TZ datetime, convert WIB ↔ UTC, ensure same instant
        cet = timezone(timedelta(hours=2))
        dt = datetime(2026, 5, 12, 10, 0, 0, tzinfo=cet)
        u = to_utc(dt)
        w = to_wib(u)
        assert w.astimezone(UTC) == dt.astimezone(UTC)
