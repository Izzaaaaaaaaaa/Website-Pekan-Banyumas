"""Tests for /api/public/karya."""

from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient
from peken_common.errors import BadRequestError

from app.schemas.karya import Karya, KaryaOwnerType


def _make_karya(subsektor: str = "Kriya", featured: bool = True) -> Karya:
    return Karya(
        id=uuid4(),
        judul="Batik Geometrik",
        subsektor=subsektor,
        deskripsi="Motif batik kontemporer",
        tahun=2024,
        gambar_url="https://storage.example.com/k.jpg",
        featured=featured,
        owner_type=KaryaOwnerType.KOLABORATOR,
        owner_id=uuid4(),
        owner="Sari Wulandari",
        owner_slug="sari-wulandari",
    )


def test_list_karya_default(client: TestClient, stub_karya_service) -> None:
    stub_karya_service.list_karya.return_value = [_make_karya(), _make_karya("Fashion", False)]
    resp = client.get("/api/public/karya")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert len(body["data"]) == 2


def test_list_karya_filter_subsektor(client: TestClient, stub_karya_service) -> None:
    stub_karya_service.list_karya.return_value = [_make_karya("Kriya")]
    resp = client.get("/api/public/karya?subsektor=Kriya&featured=true")
    assert resp.status_code == 200
    body = resp.json()
    assert all(k["subsektor"] == "Kriya" for k in body["data"])
    assert all(k["featured"] for k in body["data"])


def test_list_karya_limit_clamp(client: TestClient, stub_karya_service) -> None:
    stub_karya_service.list_karya.return_value = []
    # limit > 100 → 422 (Query validator ge/le)
    resp = client.get("/api/public/karya?limit=999")
    assert resp.status_code == 422


def test_list_karya_limit_zero_rejected(client: TestClient, stub_karya_service) -> None:
    resp = client.get("/api/public/karya?limit=0")
    assert resp.status_code == 422


def test_both_owner_filters_rejected(client: TestClient, stub_karya_service) -> None:
    stub_karya_service.list_karya.side_effect = BadRequestError(
        "Filter kolaborator_id dan artisan_id tidak boleh keduanya diisi bersamaan"
    )
    art_id = uuid4()
    kol_id = uuid4()
    resp = client.get(f"/api/public/karya?artisan_id={art_id}&kolaborator_id={kol_id}")
    assert resp.status_code == 400
    body = resp.json()
    assert body["status"] == "error"
    assert "tidak boleh keduanya" in body["message"]


def test_karya_response_shape(client: TestClient, stub_karya_service) -> None:
    stub_karya_service.list_karya.return_value = [_make_karya()]
    resp = client.get("/api/public/karya")
    item = resp.json()["data"][0]
    # Required fields per OpenAPI Karya schema
    for required in (
        "id",
        "judul",
        "subsektor",
        "deskripsi",
        "tahun",
        "featured",
        "owner_type",
        "owner_id",
        "owner",
        "owner_slug",
    ):
        assert required in item, f"Missing required field: {required}"
