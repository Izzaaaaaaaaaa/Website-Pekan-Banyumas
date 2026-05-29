"""Tests for /api/public/programs + /api/public/programs/{slug}."""

from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient
from peken_common.errors import NotFoundError

from app.schemas.program import Program


def _make_program(slug: str = "pelatihan-umkm", nama: str = "Pelatihan UMKM") -> Program:
    return Program(
        id=uuid4(),
        slug=slug,
        nama=nama,
        deskripsi="Program pelatihan untuk pelaku UMKM",
        konten="# Pelatihan UMKM\n\nKonten...",
        icon="🎓",
        icon_url=None,
        urutan=1,
        aktif=True,
    )


def test_list_programs_success(client: TestClient, stub_program_service) -> None:
    stub_program_service.list_programs.return_value = [_make_program(), _make_program("desain", "Desain")]
    resp = client.get("/api/public/programs")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert len(body["data"]) == 2
    assert body["data"][0]["slug"] == "pelatihan-umkm"
    assert body["data"][0]["nama"] == "Pelatihan UMKM"


def test_list_programs_empty(client: TestClient, stub_program_service) -> None:
    stub_program_service.list_programs.return_value = []
    resp = client.get("/api/public/programs")
    assert resp.status_code == 200
    assert resp.json()["data"] == []


def test_get_program_by_slug_success(client: TestClient, stub_program_service) -> None:
    stub_program_service.get_by_slug.return_value = _make_program()
    resp = client.get("/api/public/programs/pelatihan-umkm")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["slug"] == "pelatihan-umkm"


def test_get_program_not_found(client: TestClient, stub_program_service) -> None:
    stub_program_service.get_by_slug.side_effect = NotFoundError("Sumber daya tidak ditemukan")
    resp = client.get("/api/public/programs/missing-slug")
    assert resp.status_code == 404
    body = resp.json()
    assert body["status"] == "error"
    assert body["message"] == "Sumber daya tidak ditemukan"
