"""
test_kas_api.py — Integrasi test untuk endpoint kas via TestClient.

DB calls di-mock — tidak perlu koneksi Supabase.
Auth di-override via conftest.py (artisan dummy).
"""

import pytest
from tests.conftest import ARTISAN_ID

TODAY = "2026-03-22"

# ── Payload helper ────────────────────────────────────────────────────────────

def _kas_payload(**kwargs):
    base = {
        "jenis":    "masuk",
        "kategori": "Penjualan",
        "nominal":  100_000,
        "tgl":      TODAY,
        "metode":   "tunai",
        "qty":      1,
        "ket":      "test",
    }
    base.update(kwargs)
    return base


def _kas_row(id="kas-001", jenis="masuk", nominal=100_000, tgl=TODAY, saldo_after=None):
    return {
        "id":         id,
        "artisan_id": ARTISAN_ID,
        "jenis":      jenis,
        "kategori":   "Penjualan",
        "nominal":    nominal,
        "tgl":        tgl,
        "metode":     "tunai",
        "qty":        1,
        "ket":        "test",
        "pelanggan":  None,
        "barang":     None,
        "bukti_url":  None,
        "created_at": f"{tgl}T08:00:00",
        "saldo_after": saldo_after if saldo_after is not None else float(nominal),
    }


# ── GET /api/artisan/kas ──────────────────────────────────────────────────────

def test_get_kas_kosong(client, db):
    db["select"].return_value = []
    res = client.get("/api/artisan/kas", headers={"Authorization": "Bearer dummy"})
    assert res.status_code == 200
    assert res.json() == []


def test_get_kas_satu_entri(client, db):
    db["select"].return_value = [_kas_row()]
    res = client.get("/api/artisan/kas", headers={"Authorization": "Bearer dummy"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["saldo_after"] == 100_000.0


def test_get_kas_running_balance(client, db):
    """
    Tiga entri: masuk 100k → keluar 30k → masuk 10k.
    saldo_after harus [100k, 70k, 80k].
    """
    db["select"].return_value = [
        _kas_row("A", "masuk",  100_000, "2026-03-22"),
        _kas_row("B", "keluar",  30_000, "2026-03-23"),
        _kas_row("C", "masuk",   10_000, "2026-03-24"),
    ]
    res = client.get("/api/artisan/kas", headers={"Authorization": "Bearer dummy"})
    assert res.status_code == 200
    rows = {r["id"]: r["saldo_after"] for r in res.json()}
    assert rows["A"] == 100_000.0
    assert rows["B"] ==  70_000.0
    assert rows["C"] ==  80_000.0


def test_get_kas_filter_jenis(client, db):
    """Filter ?jenis=masuk hanya kembalikan entri masuk, tapi saldo tetap dihitung dari semua."""
    db["select"].return_value = [
        _kas_row("A", "masuk",  100_000, "2026-03-22"),
        _kas_row("B", "keluar",  30_000, "2026-03-23"),
    ]
    res = client.get("/api/artisan/kas?jenis=masuk", headers={"Authorization": "Bearer dummy"})
    assert res.status_code == 200
    data = res.json()
    assert all(r["jenis"] == "masuk" for r in data)


# ── POST /api/artisan/kas ─────────────────────────────────────────────────────

def test_tambah_kas_masuk(client, db):
    inserted = _kas_row()
    db["insert"].return_value = inserted
    db["select"].return_value = [inserted]

    res = client.post(
        "/api/artisan/kas",
        json=_kas_payload(),
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["jenis"]    == "masuk"
    assert body["nominal"]  == 100_000.0
    assert "saldo_after" in body


def test_tambah_kas_keluar(client, db):
    inserted = _kas_row("K", "keluar", 30_000)
    db["insert"].return_value = inserted
    db["select"].return_value = [inserted]

    res = client.post(
        "/api/artisan/kas",
        json=_kas_payload(jenis="keluar", nominal=30_000),
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 201
    assert res.json()["jenis"] == "keluar"


def test_tambah_kas_jenis_invalid(client, db):
    res = client.post(
        "/api/artisan/kas",
        json=_kas_payload(jenis="invalid"),
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 422   # Pydantic validation error


def test_tambah_kas_metode_invalid(client, db):
    res = client.post(
        "/api/artisan/kas",
        json=_kas_payload(metode="transfer"),  # transfer sudah dihapus di v2.2.2
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 422


# ── PUT /api/artisan/kas/{id} ─────────────────────────────────────────────────

def test_edit_kas_berhasil(client, db):
    existing = _kas_row()
    updated  = _kas_row(nominal=50_000, saldo_after=50_000.0)
    db["select"].side_effect = [
        existing,          # select untuk cek item ada
        [updated],         # select semua untuk recompute saldo
    ]
    db["update"].return_value = [updated]

    res = client.put(
        f"/api/artisan/kas/{existing['id']}",
        json={"nominal": 50_000},
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 200


def test_edit_kas_tidak_ditemukan(client, db):
    db["select"].return_value = None   # tidak ada row

    res = client.put(
        "/api/artisan/kas/tidak-ada",
        json={"nominal": 50_000},
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 404


# ── DELETE /api/artisan/kas/{id} ─────────────────────────────────────────────

def test_hapus_kas_berhasil(client, db):
    existing = _kas_row()
    db["select"].return_value = existing
    db["delete"].return_value = [existing]

    res = client.delete(
        f"/api/artisan/kas/{existing['id']}",
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 200
    assert "berhasil" in res.json()["message"].lower()


def test_hapus_kas_tidak_ditemukan(client, db):
    db["select"].return_value = None

    res = client.delete(
        "/api/artisan/kas/tidak-ada",
        headers={"Authorization": "Bearer dummy"},
    )
    assert res.status_code == 404


# ── GET /api/artisan/kas/summary ─────────────────────────────────────────────

def test_summary_benar(client, db):
    db["select"].return_value = [
        _kas_row("A", "masuk",  100_000, "2026-03-22"),
        _kas_row("B", "keluar",  30_000, "2026-03-23"),
        _kas_row("C", "masuk",   50_000, "2026-03-24"),
    ]
    res = client.get("/api/artisan/kas/summary", headers={"Authorization": "Bearer dummy"})
    assert res.status_code == 200
    body = res.json()
    assert body["total_masuk"]  == 150_000.0
    assert body["total_keluar"] ==  30_000.0
    assert body["saldo"]        == 120_000.0


def test_summary_saldo_sinkron_dengan_saldo_after_terakhir(client, db):
    """
    Regression UMKM-6: saldo summary == saldo_after baris terakhir.
    """
    rows_db = [
        _kas_row("A", "masuk",  100_000, "2026-03-22"),
        _kas_row("B", "keluar",  30_000, "2026-03-23"),
        _kas_row("C", "masuk",   10_000, "2026-03-24"),
    ]
    db["select"].return_value = rows_db

    # Summary
    res_sum = client.get("/api/artisan/kas/summary", headers={"Authorization": "Bearer dummy"})
    saldo_summary = res_sum.json()["saldo"]   # 80_000

    # List — saldo_after baris terakhir
    res_list = client.get("/api/artisan/kas", headers={"Authorization": "Bearer dummy"})
    sorted_rows = sorted(res_list.json(), key=lambda r: (r["tgl"], r.get("created_at", "")))
    saldo_last = sorted_rows[-1]["saldo_after"]

    assert saldo_summary == saldo_last


# ── Auth guard ────────────────────────────────────────────────────────────────

def test_tanpa_token_ditolak(client):
    """Endpoint protected — tanpa token harus 403 atau 401."""
    # Hapus override untuk test ini saja
    from app.main import app
    from app.middleware import get_current_user
    app.dependency_overrides.pop(get_current_user, None)

    res = client.get("/api/artisan/kas")
    assert res.status_code in (401, 403)

    # Pasang kembali override supaya test lain tidak terpengaruh
    from tests.conftest import _override_auth
    app.dependency_overrides[get_current_user] = _override_auth
