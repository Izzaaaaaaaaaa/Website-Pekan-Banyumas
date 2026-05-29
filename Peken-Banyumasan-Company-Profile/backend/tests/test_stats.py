"""Tests for /api/public/stats."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.schemas.public_stats import PublicStats


def test_stats_success(client: TestClient, stub_stats_service) -> None:
    stub_stats_service.get.return_value = PublicStats(
        edisi_count=7,
        kolaborator_aktif=142,
        artisan_aktif=89,
        pengunjung_total=28450,
    )
    resp = client.get("/api/public/stats")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data == {
        "edisi_count": 7,
        "kolaborator_aktif": 142,
        "artisan_aktif": 89,
        "pengunjung_total": 28450,
    }


def test_stats_zeros(client: TestClient, stub_stats_service) -> None:
    stub_stats_service.get.return_value = PublicStats(
        edisi_count=0, kolaborator_aktif=0, artisan_aktif=0, pengunjung_total=0
    )
    resp = client.get("/api/public/stats")
    assert resp.status_code == 200
    assert all(v == 0 for v in resp.json()["data"].values())
