"""
test_kas_unit.py — Unit test untuk _compute_saldo_after (pure function, tanpa DB).

Ini adalah regression test untuk UMKM-6: memastikan running balance selalu benar
setelah tambah, edit, dan hapus entri kas — termasuk skenario edit entri di tengah.
"""

import pytest
from app.services.kas_service import _compute_saldo_after


def _row(jenis, nominal, tgl, created_at="2026-01-01T00:00:00", id=None):
    return {
        "id":         id or f"{jenis}-{nominal}-{tgl}",
        "jenis":      jenis,
        "nominal":    nominal,
        "tgl":        tgl,
        "created_at": created_at,
    }


# ── Test dasar ────────────────────────────────────────────────────────────────

def test_kosong():
    """Tidak ada entri → kembalikan list kosong."""
    assert _compute_saldo_after([]) == []


def test_satu_masuk():
    rows = [_row("masuk", 100_000, "2026-03-22")]
    result = _compute_saldo_after(rows)
    assert result[0]["saldo_after"] == 100_000.0


def test_satu_keluar():
    rows = [_row("keluar", 30_000, "2026-03-22")]
    result = _compute_saldo_after(rows)
    assert result[0]["saldo_after"] == -30_000.0


def test_masuk_lalu_keluar():
    rows = [
        _row("masuk",  100_000, "2026-03-22"),
        _row("keluar",  30_000, "2026-03-23"),
    ]
    result = _compute_saldo_after(rows)
    assert result[0]["saldo_after"] == 100_000.0
    assert result[1]["saldo_after"] ==  70_000.0


def test_urut_berdasarkan_tgl():
    """Entri yang diberikan tidak berurutan — harus tetap diurutkan by tgl."""
    rows = [
        _row("keluar",  30_000, "2026-03-23"),   # tanggal lebih besar, posisi pertama
        _row("masuk",  100_000, "2026-03-22"),
    ]
    result = _compute_saldo_after(rows)
    # Setelah sort: masuk dulu (22), baru keluar (23)
    by_tgl = sorted(result, key=lambda r: r["tgl"])
    assert by_tgl[0]["saldo_after"] == 100_000.0
    assert by_tgl[1]["saldo_after"] ==  70_000.0


# ── Skenario UMKM-6: edit entri lama tidak boleh rusak saldo ─────────────────

def test_umkm6_regression_edit_entri_lama():
    """
    Repro UMKM-6:
      - Masuk 100rb (entry A)
      - Keluar 30rb (entry B)  → saldo = 70rb
      - "Edit" entry A nominal jadi 50rb (simulasi: ganti row di list)
      - Masuk 10rb (entry C)
    Setelah compute ulang:
      - A: 50rb
      - B: 20rb
      - C: 30rb  ← DULU salah (80rb), sekarang harus 30rb
    Summary = 30rb = saldo C ✓
    """
    rows = [
        _row("masuk",  50_000, "2026-03-22", id="A"),   # setelah edit 100k→50k
        _row("keluar", 30_000, "2026-03-23", id="B"),
        _row("masuk",  10_000, "2026-03-24", id="C"),
    ]
    result = _compute_saldo_after(rows)
    by_id = {r["id"]: r["saldo_after"] for r in result}

    assert by_id["A"] == 50_000.0
    assert by_id["B"] == 20_000.0
    assert by_id["C"] == 30_000.0

    # Saldo terakhir == total_masuk - total_keluar
    total_masuk  = sum(float(r["nominal"]) for r in rows if r["jenis"] == "masuk")
    total_keluar = sum(float(r["nominal"]) for r in rows if r["jenis"] == "keluar")
    assert by_id["C"] == total_masuk - total_keluar


def test_umkm6_regression_hapus_entri_tengah():
    """
    Hapus entri di tengah: masuk 100rb → masuk 50rb → keluar 30rb.
    Hapus entri pertama (100rb).
    Sisa: masuk 50rb → keluar 30rb → saldo = 20rb.
    """
    rows = [
        _row("masuk",  50_000, "2026-03-23", id="B"),
        _row("keluar", 30_000, "2026-03-24", id="C"),
    ]
    result = _compute_saldo_after(rows)
    by_id = {r["id"]: r["saldo_after"] for r in result}

    assert by_id["B"] == 50_000.0
    assert by_id["C"] == 20_000.0


def test_tiebreak_created_at():
    """
    Dua entri di tanggal sama — urutan ditentukan oleh created_at.
    """
    rows = [
        _row("keluar", 30_000, "2026-03-22", created_at="2026-03-22T10:00:00", id="K"),
        _row("masuk", 100_000, "2026-03-22", created_at="2026-03-22T08:00:00", id="M"),
    ]
    result = _compute_saldo_after(rows)
    by_id = {r["id"]: r["saldo_after"] for r in result}

    # masuk (08:00) duluan → saldo setelah masuk = 100k, setelah keluar = 70k
    assert by_id["M"] == 100_000.0
    assert by_id["K"] ==  70_000.0


def test_saldo_sinkron_dengan_summary():
    """
    Saldo baris terakhir harus == total_masuk - total_keluar.
    Berlaku untuk semua kombinasi.
    """
    rows = [
        _row("masuk",  200_000, "2026-03-22"),
        _row("keluar",  50_000, "2026-03-23"),
        _row("masuk",   75_000, "2026-03-24"),
        _row("keluar",  25_000, "2026-03-25"),
        _row("masuk",  100_000, "2026-03-26"),
    ]
    result   = _compute_saldo_after(rows)
    last     = sorted(result, key=lambda r: (r["tgl"], r["created_at"]))[-1]
    summary  = sum(float(r["nominal"]) * (1 if r["jenis"]=="masuk" else -1) for r in rows)
    assert last["saldo_after"] == summary
