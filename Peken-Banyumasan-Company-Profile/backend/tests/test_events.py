"""Tests for /api/public/events and /api/public/events/upcoming."""

from __future__ import annotations

from datetime import date, time
from uuid import uuid4

from fastapi.testclient import TestClient

from app.schemas.event_public import EventPublic


def _make_event(status: str = "published", nama: str = "Peken Banyumas #7") -> EventPublic:
    return EventPublic(
        id=uuid4(),
        nama=nama,
        tanggal=date(2026, 5, 10),
        tanggal_selesai=date(2026, 5, 12),
        jam_mulai=time(9, 0),
        jam_selesai=time(21, 0),
        lokasi="Alun-alun Purwokerto",
        status=status,
        deskripsi="Pameran",
        subsektor=["Kriya", "Fashion"],
        banner_url=None,
    )


def test_list_events_default(client: TestClient, stub_event_service) -> None:
    stub_event_service.list_events.return_value = [_make_event(), _make_event("berlangsung")]
    resp = client.get("/api/public/events")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 2


def test_list_events_status_filter(client: TestClient, stub_event_service) -> None:
    stub_event_service.list_events.return_value = [_make_event("published")]
    resp = client.get("/api/public/events?status=published")
    assert resp.status_code == 200
    assert all(e["status"] == "published" for e in resp.json()["data"])


def test_list_events_status_draft_rejected(client: TestClient, stub_event_service) -> None:
    # Plan §24.4 — `draft` MUST NEVER be a public status. Enum at the route
    # layer rejects it before hitting the service.
    resp = client.get("/api/public/events?status=draft")
    assert resp.status_code == 422


def test_list_events_date_range(client: TestClient, stub_event_service) -> None:
    stub_event_service.list_events.return_value = []
    resp = client.get("/api/public/events?from=2026-01-01&to=2026-12-31")
    assert resp.status_code == 200
    # Confirm service got the date objects, not strings
    call_args = stub_event_service.list_events.call_args
    assert call_args.kwargs["date_from"] == date(2026, 1, 1)
    assert call_args.kwargs["date_to"] == date(2026, 12, 31)


def test_list_events_limit_clamp(client: TestClient, stub_event_service) -> None:
    resp = client.get("/api/public/events?limit=999")
    assert resp.status_code == 422


def test_upcoming_default_limit_5(client: TestClient, stub_event_service) -> None:
    stub_event_service.list_upcoming.return_value = [_make_event() for _ in range(3)]
    resp = client.get("/api/public/events/upcoming")
    assert resp.status_code == 200
    # call_args confirms default limit
    call_args = stub_event_service.list_upcoming.call_args
    assert call_args.kwargs["limit"] == 5


def test_upcoming_max_20(client: TestClient, stub_event_service) -> None:
    resp = client.get("/api/public/events/upcoming?limit=21")
    assert resp.status_code == 422  # Query ge=1, le=20


def test_event_response_shape(client: TestClient, stub_event_service) -> None:
    stub_event_service.list_events.return_value = [_make_event()]
    item = client.get("/api/public/events").json()["data"][0]
    for required in (
        "id",
        "nama",
        "tanggal",
        "tanggal_selesai",
        "jam_mulai",
        "jam_selesai",
        "lokasi",
        "status",
        "deskripsi",
        "subsektor",
    ):
        assert required in item, f"Missing required field: {required}"
    # Date format is YYYY-MM-DD (WIB local)
    assert item["tanggal"] == "2026-05-10"
    # Time format HH:MM:SS (Pydantic time serializer)
    assert item["jam_mulai"].startswith("09:00")
