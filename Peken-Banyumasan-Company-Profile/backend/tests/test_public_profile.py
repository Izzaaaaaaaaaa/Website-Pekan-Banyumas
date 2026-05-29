"""Tests for /api/public/profiles/{slug} — admin-only leak audit lives here."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient
from peken_common.errors import NotFoundError

from app.schemas.karya import Karya, KaryaOwnerType
from app.schemas.public_profile import ProfileRole, PublicProfile
from app.schemas.story import Story

ADMIN_ONLY_FIELDS = (
    "email",
    "no_hp",
    "internal_notes",
    "komisi_persen",
    "total_penjualan",
    "komisi_terkumpul",
)


def _make_profile(slug: str = "sari-wulandari", role: ProfileRole = ProfileRole.KOLABORATOR) -> PublicProfile:
    owner_id = uuid4()
    return PublicProfile(
        id=owner_id,
        slug=slug,
        nama="Sari Wulandari",
        role=role,
        kota="Purwokerto",
        bio="Desainer tekstil",
        foto_url="https://x.com/foto.jpg",
        cover_url=None,
        subsektor=["Kriya", "Fashion"],
        karya=[
            Karya(
                id=uuid4(),
                judul="Batik",
                subsektor="Kriya",
                deskripsi="...",
                tahun=2024,
                featured=True,
                owner_type=KaryaOwnerType.KOLABORATOR,
                owner_id=owner_id,
                owner="Sari Wulandari",
                owner_slug=slug,
            )
        ],
        story=[
            Story(
                id=uuid4(),
                konten="Pameran di Jakarta",
                media_url=None,
                tags=["pameran"],
                like_count=12,
                status="aktif",
                created_at=datetime.now(UTC),
            )
        ],
    )


def test_get_profile_success(client: TestClient, stub_profile_service) -> None:
    stub_profile_service.get_by_slug.return_value = _make_profile()
    resp = client.get("/api/public/profiles/sari-wulandari")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["slug"] == "sari-wulandari"
    assert data["role"] == "kolaborator"


def test_profile_not_found(client: TestClient, stub_profile_service) -> None:
    stub_profile_service.get_by_slug.side_effect = NotFoundError("Profil tidak ditemukan")
    resp = client.get("/api/public/profiles/missing")
    assert resp.status_code == 404
    assert resp.json()["message"] == "Profil tidak ditemukan"


def test_profile_response_has_no_admin_only_fields(
    client: TestClient, stub_profile_service
) -> None:
    """Plan §24.5 regression — admin-only fields must NEVER leak here."""
    stub_profile_service.get_by_slug.return_value = _make_profile()
    resp = client.get("/api/public/profiles/sari-wulandari")
    body = resp.json()
    data = body["data"]
    for field in ADMIN_ONLY_FIELDS:
        assert field not in data, f"Admin-only field leaked: {field}"


def test_artisan_role_works(client: TestClient, stub_profile_service) -> None:
    stub_profile_service.get_by_slug.return_value = _make_profile(
        slug="warung-bahagia", role=ProfileRole.ARTISAN
    )
    resp = client.get("/api/public/profiles/warung-bahagia")
    assert resp.status_code == 200
    assert resp.json()["data"]["role"] == "artisan"


def test_subsektor_field_is_list(client: TestClient, stub_profile_service) -> None:
    stub_profile_service.get_by_slug.return_value = _make_profile()
    data = client.get("/api/public/profiles/sari-wulandari").json()["data"]
    assert isinstance(data["subsektor"], list)


def test_embedded_karya_has_owner_fields(client: TestClient, stub_profile_service) -> None:
    stub_profile_service.get_by_slug.return_value = _make_profile()
    data = client.get("/api/public/profiles/sari-wulandari").json()["data"]
    karya0 = data["karya"][0]
    assert karya0["owner"] == "Sari Wulandari"
    assert karya0["owner_slug"] == "sari-wulandari"
