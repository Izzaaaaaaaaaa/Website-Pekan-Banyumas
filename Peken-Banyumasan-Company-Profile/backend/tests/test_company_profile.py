"""Tests for /api/public/company-profile?section=..."""

from __future__ import annotations

from fastapi.testclient import TestClient
from peken_common.errors import NotFoundError


def test_get_section_success(client: TestClient, stub_company_profile_service) -> None:
    stub_company_profile_service.get_section.return_value = {
        "hero_title": "Ruang Kreatif Banyumas",
        "hero_subtitle": "Wadah kolaborasi",
    }
    resp = client.get("/api/public/company-profile?section=home")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["hero_title"] == "Ruang Kreatif Banyumas"


def test_invalid_section_rejected(client: TestClient, stub_company_profile_service) -> None:
    resp = client.get("/api/public/company-profile?section=not-a-section")
    # FastAPI Pydantic enum validation rejects with 422
    assert resp.status_code == 422
    body = resp.json()
    assert body["status"] == "error"
    assert body["message"] == "Validasi gagal"


def test_missing_section_rejected(client: TestClient, stub_company_profile_service) -> None:
    resp = client.get("/api/public/company-profile")
    assert resp.status_code == 422


def test_section_not_found(client: TestClient, stub_company_profile_service) -> None:
    stub_company_profile_service.get_section.side_effect = NotFoundError(
        "Sumber daya tidak ditemukan"
    )
    resp = client.get("/api/public/company-profile?section=about")
    assert resp.status_code == 404
    assert resp.json()["message"] == "Sumber daya tidak ditemukan"


def test_all_six_sections_valid(client: TestClient, stub_company_profile_service) -> None:
    stub_company_profile_service.get_section.return_value = {}
    for sec in ("home", "about", "tim", "programs", "works", "gallery"):
        resp = client.get(f"/api/public/company-profile?section={sec}")
        assert resp.status_code == 200, f"Section {sec} should be valid"
