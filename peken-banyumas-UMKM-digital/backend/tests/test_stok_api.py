"""
test_stok_api.py — Smoke test untuk endpoint stok.
"""

import pytest
from tests.conftest import ARTISAN_ID

AUTH = {"Authorization": "Bearer dummy"}


def _stok_row(id="stok-001", nama="Batik Biru", stok=10, stok_min=5):
    return {
        "id":        id,
        "artisan_id": ARTISAN_ID,
        "nama":      nama,
        "harga":     50_000.0,
        "stok":      stok,
        "kategori":  "fashion",
        "satuan":    "pcs",
        "deskripsi": "",
        "stok_min":  stok_min,
        "created_at": None,
        "updated_at": None,
    }


# ── GET /api/artisan/stok ─────────────────────────────────────────────────────

def test_get_stok_kosong(client, db):
    db["select"].return_value = []
    res = client.get("/api/artisan/stok", headers=AUTH)
    assert res.status_code == 200
    assert res.json() == []


def test_get_stok_ada_data(client, db):
    db["select"].return_value = [_stok_row()]
    res = client.get("/api/artisan/stok", headers=AUTH)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["nama"] == "Batik Biru"


# ── GET /api/artisan/stok/kritis ──────────────────────────────────────────────

def test_get_stok_kritis(client, db):
    db["select"].return_value = [
        _stok_row("A", stok=3, stok_min=5),   # kritis
        _stok_row("B", stok=10, stok_min=5),  # aman
    ]
    res = client.get("/api/artisan/stok/kritis", headers=AUTH)
    assert res.status_code == 200
    data = res.json()
    # hanya yang stok <= stok_min
    assert all(r["stok"] <= r["stok_min"] for r in data)


# ── POST /api/artisan/stok ────────────────────────────────────────────────────

def test_tambah_stok(client, db):
    new_item = _stok_row()
    db["insert"].return_value = new_item
    db["select"].return_value = []  # notif check: stok > stok_min, aman

    res = client.post(
        "/api/artisan/stok",
        json={"nama": "Batik Biru", "harga": 50000, "stok": 10, "stok_min": 5},
        headers=AUTH,
    )
    assert res.status_code == 201
    assert res.json()["nama"] == "Batik Biru"


def test_tambah_stok_field_wajib_kosong(client, db):
    res = client.post(
        "/api/artisan/stok",
        json={"harga": 50000, "stok": 10},   # nama wajib
        headers=AUTH,
    )
    assert res.status_code == 422


# ── PUT /api/artisan/stok/{id} ────────────────────────────────────────────────

def test_edit_stok_berhasil(client, db):
    existing = _stok_row()
    updated  = {**existing, "stok": 20}
    db["select"].return_value = existing
    db["update"].return_value = [updated]

    res = client.put(
        f"/api/artisan/stok/{existing['id']}",
        json={"stok": 20},
        headers=AUTH,
    )
    assert res.status_code == 200


def test_edit_stok_tidak_ditemukan(client, db):
    db["select"].return_value = None
    res = client.put(
        "/api/artisan/stok/tidak-ada",
        json={"stok": 20},
        headers=AUTH,
    )
    assert res.status_code == 404


# ── DELETE /api/artisan/stok/{id} ────────────────────────────────────────────

def test_hapus_stok_berhasil(client, db):
    existing = _stok_row()
    db["select"].return_value = existing
    db["delete"].return_value = [existing]

    res = client.delete(f"/api/artisan/stok/{existing['id']}", headers=AUTH)
    assert res.status_code == 200
    assert "berhasil" in res.json()["message"].lower()


def test_hapus_stok_tidak_ditemukan(client, db):
    db["select"].return_value = None
    res = client.delete("/api/artisan/stok/tidak-ada", headers=AUTH)
    assert res.status_code == 404
