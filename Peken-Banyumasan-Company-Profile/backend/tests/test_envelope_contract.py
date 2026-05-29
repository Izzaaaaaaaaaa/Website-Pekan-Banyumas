"""Cross-endpoint contract: every response carries the envelope shape."""

from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient
from peken_common.errors import NotFoundError

from app.schemas.program import Program
from app.schemas.public_profile import ProfileRole, PublicProfile
from app.schemas.public_stats import PublicStats


def _envelope_keys(body: dict) -> set[str]:
    return set(body.keys())


def test_success_envelope_shape_company_profile(client: TestClient, stub_company_profile_service) -> None:
    stub_company_profile_service.get_section.return_value = {"x": 1}
    body = client.get("/api/public/company-profile?section=home").json()
    assert body["status"] == "success"
    assert "data" in body
    assert "message" in body


def test_success_envelope_shape_programs(client: TestClient, stub_program_service) -> None:
    stub_program_service.list_programs.return_value = []
    body = client.get("/api/public/programs").json()
    assert body["status"] == "success"
    assert body["data"] == []
    assert body["message"] is None


def test_success_envelope_shape_karya(client: TestClient, stub_karya_service) -> None:
    stub_karya_service.list_karya.return_value = []
    body = client.get("/api/public/karya").json()
    assert body["status"] == "success"
    assert body["data"] == []


def test_success_envelope_shape_events(client: TestClient, stub_event_service) -> None:
    stub_event_service.list_events.return_value = []
    body = client.get("/api/public/events").json()
    assert body["status"] == "success"


def test_success_envelope_shape_stats(client: TestClient, stub_stats_service) -> None:
    stub_stats_service.get.return_value = PublicStats(
        edisi_count=1, kolaborator_aktif=1, artisan_aktif=1, pengunjung_total=1
    )
    body = client.get("/api/public/stats").json()
    assert body["status"] == "success"


def test_error_envelope_shape_404(client: TestClient, stub_program_service) -> None:
    stub_program_service.get_by_slug.side_effect = NotFoundError("Sumber daya tidak ditemukan")
    body = client.get("/api/public/programs/missing").json()
    assert body["status"] == "error"
    assert body["message"] == "Sumber daya tidak ditemukan"
    assert body["data"] is None


def test_error_envelope_shape_422(client: TestClient, stub_company_profile_service) -> None:
    body = client.get("/api/public/company-profile?section=invalid").json()
    assert body["status"] == "error"
    assert body["message"] == "Validasi gagal"
    assert "errors" in body


def test_all_endpoints_emit_envelope(client: TestClient,
                                      stub_company_profile_service,
                                      stub_program_service,
                                      stub_karya_service,
                                      stub_profile_service,
                                      stub_event_service,
                                      stub_stats_service) -> None:
    """Sanity sweep — every endpoint emits a properly-shaped envelope."""
    stub_company_profile_service.get_section.return_value = {}
    stub_program_service.list_programs.return_value = []
    stub_program_service.get_by_slug.return_value = Program(
        id=uuid4(), slug="x", nama="x", deskripsi="x", konten="", icon="", urutan=0, aktif=True
    )
    stub_karya_service.list_karya.return_value = []
    stub_profile_service.get_by_slug.return_value = PublicProfile(
        id=uuid4(), slug="x", nama="x", role=ProfileRole.ARTISAN,
        kota="", bio="", subsektor=[], karya=[], story=[]
    )
    stub_event_service.list_events.return_value = []
    stub_event_service.list_upcoming.return_value = []
    stub_stats_service.get.return_value = PublicStats(
        edisi_count=0, kolaborator_aktif=0, artisan_aktif=0, pengunjung_total=0
    )

    paths = (
        "/api/public/company-profile?section=home",
        "/api/public/programs",
        "/api/public/programs/x",
        "/api/public/karya",
        "/api/public/profiles/x",
        "/api/public/events",
        "/api/public/events/upcoming",
        "/api/public/stats",
    )
    for path in paths:
        resp = client.get(path)
        assert resp.status_code == 200, f"{path} returned {resp.status_code}"
        body = resp.json()
        assert body["status"] == "success", f"{path} status != success"
        assert "data" in body, f"{path} missing data field"
