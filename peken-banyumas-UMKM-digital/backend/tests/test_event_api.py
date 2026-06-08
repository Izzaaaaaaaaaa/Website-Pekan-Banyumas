"""
test_event_api.py — Smoke test untuk endpoint event.
"""

import pytest
from tests.conftest import ARTISAN_ID

AUTH = {"Authorization": "Bearer dummy"}

TODAY = "2026-03-22"


def _event(id="evt-001", status="published"):
    return {
        "id":              id,
        "nama":            "Peken Banyumas 2026",
        "tanggal":         TODAY,
        "tanggal_selesai": "2026-03-24",
        "jam_mulai":       "08:00",
        "jam_selesai":     "21:00",
        "lokasi":          "Taman Sari Banyumas",
        "status":          status,
        "kapasitas":       None,
        "peserta_count":   0,
        "deskripsi":       "Event tahunan UMKM Banyumas",
        "konten_lengkap":  None,
        "subsektor":       [],
        "banner_url":      None,
        "galeri":          [],
        "created_at":      None,
        "updated_at":      None,
    }


def _request_row(event_id="evt-001"):
    return {
        "id":             "req-001",
        "event_id":       event_id,
        "artisan_id":     ARTISAN_ID,
        "posisi_event":   "U-01",
        "status_request": "pending",
        "change_request": None,
        "assigned_by":    "self",
        "created_at":     None,
        "updated_at":     None,
    }


# ── GET /api/event — publik ───────────────────────────────────────────────────

def test_get_events_publik(client, db):
    """Endpoint GET /event tidak butuh auth."""
    db["select"].return_value = [_event("A", "published"), _event("B", "draft")]
    res = client.get("/api/event")
    assert res.status_code == 200
    # hanya published/berlangsung/selesai yang dikembalikan
    data = res.json()
    assert all(e["status"] in {"published", "berlangsung", "selesai"} for e in data)


def test_get_events_filter_status(client, db):
    """Event draft tidak boleh muncul di list publik."""
    db["select"].return_value = [
        _event("A", "published"),
        _event("B", "draft"),
        _event("C", "berlangsung"),
        _event("D", "selesai"),
    ]
    res = client.get("/api/event")
    assert res.status_code == 200
    ids = {e["id"] for e in res.json()}
    assert "B" not in ids   # draft tersaring
    assert "A" in ids
    assert "C" in ids
    assert "D" in ids


# ── GET /api/event/saya ───────────────────────────────────────────────────────

def test_get_event_saya(client, db):
    db["select"].return_value = [_request_row()]
    res = client.get("/api/event/saya", headers=AUTH)
    assert res.status_code == 200


def test_get_event_saya_kosong(client, db):
    db["select"].return_value = []
    res = client.get("/api/event/saya", headers=AUTH)
    assert res.status_code == 200
    assert res.json() == []


# ── POST /api/event/daftar ────────────────────────────────────────────────────

def test_daftar_event_berhasil(client, db):
    # select dipanggil 4x: cek request, cek approved, validasi stand, get event
    db["select"].side_effect = [
        None,                                          # belum ada request
        None,                                          # belum ada di event_artisans
        [{"stands": [{"id": "U-01"}]}],               # zones — stand valid
        None,                                          # occupied check
        _event(),                                      # get event by id
    ]
    db["insert"].return_value = _request_row()

    res = client.post(
        "/api/event/daftar",
        json={"event_id": "evt-001", "posisi_event": "U-01"},
        headers=AUTH,
    )
    assert res.status_code == 201
    assert res.json()["status_request"] == "pending"


def test_daftar_event_duplikat(client, db):
    """Artisan sudah punya request → harus 400."""
    db["select"].return_value = _request_row()   # sudah ada

    res = client.post(
        "/api/event/daftar",
        json={"event_id": "evt-001", "posisi_event": "U-01"},
        headers=AUTH,
    )
    assert res.status_code == 400


def test_daftar_event_stand_tidak_valid(client, db):
    """Stand tidak ada di zones → harus 400."""
    db["select"].side_effect = [
        None,                           # belum ada request
        None,                           # belum ada di event_artisans
        [{"stands": [{"id": "X-99"}]}], # zones — stand U-01 tidak ada
    ]

    res = client.post(
        "/api/event/daftar",
        json={"event_id": "evt-001", "posisi_event": "U-01"},
        headers=AUTH,
    )
    assert res.status_code == 400
