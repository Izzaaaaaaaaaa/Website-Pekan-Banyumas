"""
test_money_chain.py — Regression test untuk money pipeline UMKM.

Skenario (dari plan 2026-06-11):
  Step 1: tambah_kas masuk 100_000
  Step 2: edit_kas  masuk 100_000 → 50_000  (edit first row)
  Step 3: hapus_kas
  Step 4: tambah_kas masuk 75_000

Setelah setiap step assert:
  - saldo_after chain benar (running balance)
  - artisans.total_penjualan == SUM(kas masuk)
  - artisans.komisi_terkumpul == ROUND(total * persen / 100, 2)

Invariants (dari plan):
  total_penjualan = SUM(kas masuk)
  komisi          = ROUND(total * persen / 100, 2)
  saldo_after     = running balance ordered (tgl, created_at)
  Semua kalkulasi pakai Decimal — no float drift.

DB calls di-mock via monkeypatch (no real Supabase).
"""

import pytest
from decimal import Decimal, ROUND_HALF_UP
from unittest.mock import MagicMock, call, patch
from tests.conftest import ARTISAN_ID

# ── Konstanta ─────────────────────────────────────────────────────────────────
KOMISI_PERSEN = Decimal("10")          # 10%
KAS_ID_A      = "kas-aaaaaa-0001"
KAS_ID_B      = "kas-bbbbbb-0002"

TODAY_1 = "2026-03-22"
TODAY_2 = "2026-03-24"


def _artisan(total_penjualan="0", komisi="0"):
    return {
        "id":                 ARTISAN_ID,
        "komisi_persen":      str(KOMISI_PERSEN),
        "total_penjualan":    total_penjualan,
        "komisi_terkumpul":   komisi,
    }


def _kas_row(id, nominal, tgl, jenis="masuk", created_at=None):
    return {
        "id":          id,
        "artisan_id":  ARTISAN_ID,
        "jenis":       jenis,
        "kategori":    "Penjualan",
        "nominal":     nominal,
        "tgl":         tgl,
        "metode":      "tunai",
        "qty":         1,
        "ket":         "test",
        "pelanggan":   None,
        "barang":      None,
        "barang_id":   None,
        "bukti_url":   None,
        "saldo_after": None,
        "created_at":  created_at or f"{tgl}T08:00:00",
    }


def _expected_komisi(total: Decimal, persen: Decimal) -> Decimal:
    """Rumus persis sama dengan recompute_artisan_aggregates."""
    return (total * persen / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ── Helper: tangkap argumen db_update ─────────────────────────────────────────
def _last_artisan_update(mock_update):
    """Ambil data dict dari panggilan db_update terakhir yang target artisans."""
    for c in reversed(mock_update.call_args_list):
        args, kwargs = c
        table = args[0] if args else kwargs.get("table", "")
        if table == "artisans":
            return args[2] if len(args) >= 3 else kwargs.get("data", {})
    return {}


# ── Fixture: import service dengan DB ter-patch ────────────────────────────────
@pytest.fixture
def svc(monkeypatch):
    """
    Kembalikan kas_service dengan db_select / db_insert / db_update / db_delete
    ter-patch. State DB disimulasikan via list `kas_rows` yang di-mutasi langsung.
    """
    import app.services.kas_service as ks

    kas_rows: list[dict] = []          # state DB in-memory
    artisan_row = _artisan()           # artisan dengan komisi 10%

    mock_select = MagicMock()
    mock_insert = MagicMock()
    mock_update = MagicMock()
    mock_delete = MagicMock()

    def _select(table, filters=None, single=False):
        if table == "kas":
            rows = [r for r in kas_rows if r["artisan_id"] == ARTISAN_ID]
            if filters:
                for k, v in filters.items():
                    rows = [r for r in rows if r.get(k) == v]
            if single:
                return rows[0] if rows else None
            return rows
        if table == "artisans":
            if single:
                return artisan_row
            return [artisan_row]
        if table == "stok":
            return [] if not single else None
        return [] if not single else None

    def _insert(table, data):
        if table == "kas":
            kas_rows.append(data)
            return data
        return data

    def _update(table, filters, data):
        if table == "kas":
            for r in kas_rows:
                match = all(r.get(k) == v for k, v in filters.items())
                if match:
                    r.update(data)
            updated = [r for r in kas_rows
                       if all(r.get(k) == v for k, v in filters.items())]
            return updated
        if table == "artisans":
            artisan_row.update(data)
            return [artisan_row]
        return []

    def _delete(table, filters):
        if table == "kas":
            to_remove = [r for r in kas_rows
                         if all(r.get(k) == v for k, v in filters.items())]
            for r in to_remove:
                kas_rows.remove(r)
        return []

    mock_select.side_effect = _select
    mock_insert.side_effect = _insert
    mock_update.side_effect = _update
    mock_delete.side_effect = _delete

    monkeypatch.setattr(ks, "db_select", mock_select)
    monkeypatch.setattr(ks, "db_insert", mock_insert)
    monkeypatch.setattr(ks, "db_update", mock_update)
    monkeypatch.setattr(ks, "db_delete", mock_delete)

    # Patch notif_helper agar tidak crash (tidak ada DB notifikasi di test)
    monkeypatch.setattr(
        "app.services.kas_service.notif_transaksi_baru",
        MagicMock(),
        raising=False,
    )

    return {
        "service":   ks,
        "kas_rows":  kas_rows,
        "artisan":   artisan_row,
        "mocks": {
            "select": mock_select,
            "insert": mock_insert,
            "update": mock_update,
            "delete": mock_delete,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# STEP-BY-STEP REGRESSION
# ─────────────────────────────────────────────────────────────────────────────

class TestMoneyChain:
    """
    Jalankan empat step berurutan dalam satu class supaya state
    dapat diperiksa setelah setiap step.
    """

    def test_step1_tambah_masuk_100k(self, svc):
        """Step 1: tambah kas masuk 100_000."""
        from app.schemas.kas import TambahKasSchema

        body = TambahKasSchema(
            jenis="masuk", kategori="Penjualan",
            nominal=100_000, tgl=TODAY_1, metode="tunai", qty=1, ket="step1",
        )

        # Override uuid agar ID deterministik
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            result = svc["service"].tambah_kas(ARTISAN_ID, body)

        kas = svc["kas_rows"]
        artisan = svc["artisan"]

        # saldo_after chain
        assert len(kas) == 1
        assert kas[0]["saldo_after"] == Decimal("100000")

        # total_penjualan & komisi
        total = Decimal("100000")
        assert Decimal(str(artisan["total_penjualan"])) == total
        assert Decimal(str(artisan["komisi_terkumpul"])) == _expected_komisi(total, KOMISI_PERSEN)
        # 100_000 * 10% = 10_000.00
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("10000.00")

    def test_step2_edit_first_row_50k(self, svc):
        """Step 2: edit row pertama — nominal 100_000 → 50_000."""
        from app.schemas.kas import TambahKasSchema, EditKasSchema

        # Seed step 1 dulu
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=100_000, tgl=TODAY_1, metode="tunai", qty=1, ket="step1",
                ),
            )

        # Edit
        body = EditKasSchema(nominal=50_000)
        svc["service"].edit_kas(ARTISAN_ID, KAS_ID_A, body)

        kas = svc["kas_rows"]
        artisan = svc["artisan"]

        # saldo_after chain setelah edit
        assert len(kas) == 1
        assert kas[0]["nominal"] == 50_000
        assert kas[0]["saldo_after"] == Decimal("50000")

        # aggregates
        total = Decimal("50000")
        assert Decimal(str(artisan["total_penjualan"])) == total
        assert Decimal(str(artisan["komisi_terkumpul"])) == _expected_komisi(total, KOMISI_PERSEN)
        # 50_000 * 10% = 5_000.00
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("5000.00")

    def test_step3_hapus_row(self, svc):
        """Step 3: hapus satu-satunya row → kas kosong, aggregates nol."""
        from app.schemas.kas import TambahKasSchema

        # Seed step 1
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=100_000, tgl=TODAY_1, metode="tunai", qty=1, ket="step1",
                ),
            )

        # Hapus
        svc["service"].hapus_kas(ARTISAN_ID, KAS_ID_A)

        kas = svc["kas_rows"]
        artisan = svc["artisan"]

        # Kas kosong
        assert kas == []

        # total_penjualan & komisi harus nol
        assert Decimal(str(artisan["total_penjualan"])) == Decimal("0")
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("0.00")

    def test_step4_tambah_lagi_75k(self, svc):
        """Step 4: tambah kas baru 75_000 — saldo & aggregates harus fresh dari nol."""
        from app.schemas.kas import TambahKasSchema

        # Seed step 1 lalu hapus (simulasikan state setelah step 3)
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=100_000, tgl=TODAY_1, metode="tunai", qty=1, ket="step1",
                ),
            )
        svc["service"].hapus_kas(ARTISAN_ID, KAS_ID_A)

        # Tambah baru
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_B):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=75_000, tgl=TODAY_2, metode="tunai", qty=1, ket="step4",
                ),
            )

        kas = svc["kas_rows"]
        artisan = svc["artisan"]

        assert len(kas) == 1
        assert kas[0]["id"] == KAS_ID_B
        assert kas[0]["saldo_after"] == Decimal("75000")

        total = Decimal("75000")
        assert Decimal(str(artisan["total_penjualan"])) == total
        assert Decimal(str(artisan["komisi_terkumpul"])) == _expected_komisi(total, KOMISI_PERSEN)
        # 75_000 * 10% = 7_500.00
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("7500.00")

    def test_full_chain_sequential(self, svc):
        """
        Jalankan semua 4 step dalam satu test tanpa seed ulang —
        ini adalah regression test sesungguhnya: state harus konsisten end-to-end.

        masuk 100k → edit 50k → hapus → masuk 75k
        Assert setelah setiap step.
        """
        from app.schemas.kas import TambahKasSchema, EditKasSchema

        kas = svc["kas_rows"]
        artisan = svc["artisan"]

        # ── Step 1: tambah 100k ───────────────────────────────────────────────
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=100_000, tgl=TODAY_1, metode="tunai", qty=1, ket="s1",
                ),
            )

        assert len(kas) == 1
        assert kas[0]["saldo_after"] == Decimal("100000")
        assert Decimal(str(artisan["total_penjualan"])) == Decimal("100000")
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("10000.00")

        # ── Step 2: edit 100k → 50k ───────────────────────────────────────────
        svc["service"].edit_kas(ARTISAN_ID, KAS_ID_A, EditKasSchema(nominal=50_000))

        assert kas[0]["nominal"] == 50_000
        assert kas[0]["saldo_after"] == Decimal("50000")
        assert Decimal(str(artisan["total_penjualan"])) == Decimal("50000")
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("5000.00")

        # ── Step 3: hapus ─────────────────────────────────────────────────────
        svc["service"].hapus_kas(ARTISAN_ID, KAS_ID_A)

        assert kas == []
        assert Decimal(str(artisan["total_penjualan"])) == Decimal("0")
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("0.00")

        # ── Step 4: tambah 75k ────────────────────────────────────────────────
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_B):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=75_000, tgl=TODAY_2, metode="tunai", qty=1, ket="s4",
                ),
            )

        assert len(kas) == 1
        assert kas[0]["id"] == KAS_ID_B
        assert kas[0]["saldo_after"] == Decimal("75000")
        assert Decimal(str(artisan["total_penjualan"])) == Decimal("75000")
        assert Decimal(str(artisan["komisi_terkumpul"])) == Decimal("7500.00")

        # ── Invariant akhir: saldo_after == total_masuk - total_keluar ─────────
        total_masuk  = sum(Decimal(str(r["nominal"])) for r in kas if r["jenis"] == "masuk")
        total_keluar = sum(Decimal(str(r["nominal"])) for r in kas if r["jenis"] == "keluar")
        assert Decimal(str(kas[-1]["saldo_after"])) == total_masuk - total_keluar


# ─────────────────────────────────────────────────────────────────────────────
# EDGE CASES — Decimal precision & komisi rounding
# ─────────────────────────────────────────────────────────────────────────────

class TestKomisiPrecision:
    """Pastikan komisi tidak pernah float drift dan rounding benar."""

    def test_komisi_pecahan(self, svc):
        """
        Nominal 150_000, persen 11% → komisi = 16_500.00 (exact, no drift).
        """
        from app.schemas.kas import TambahKasSchema

        svc["artisan"]["komisi_persen"] = "11"
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=150_000, tgl=TODAY_1, metode="tunai", qty=1, ket="pecahan",
                ),
            )

        komisi = Decimal(str(svc["artisan"]["komisi_terkumpul"]))
        expected = (Decimal("150000") * Decimal("11") / 100).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        assert komisi == expected
        assert komisi == Decimal("16500.00")

    def test_komisi_tidak_melebihi_total(self, svc):
        """komisi_terkumpul tidak boleh melebihi total_penjualan (logika bisnis)."""
        from app.schemas.kas import TambahKasSchema

        svc["artisan"]["komisi_persen"] = "10"
        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=200_000, tgl=TODAY_1, metode="tunai", qty=1, ket="batas",
                ),
            )

        total  = Decimal(str(svc["artisan"]["total_penjualan"]))
        komisi = Decimal(str(svc["artisan"]["komisi_terkumpul"]))
        assert komisi <= total

    def test_saldo_after_decimal_tidak_drift(self, svc):
        """
        Saldo harus menggunakan Decimal, bukan float — tidak boleh ada drift seperti
        100_000.0000000001.
        """
        from app.schemas.kas import TambahKasSchema

        with patch("app.services.kas_service.uuid.uuid4", return_value=KAS_ID_A):
            svc["service"].tambah_kas(
                ARTISAN_ID,
                TambahKasSchema(
                    jenis="masuk", kategori="Penjualan",
                    nominal=333_333, tgl=TODAY_1, metode="tunai", qty=1, ket="drift",
                ),
            )

        saldo = svc["kas_rows"][0]["saldo_after"]
        # Nilai tidak boleh punya presisi lebih dari 2 desimal yang salah
        assert Decimal(str(saldo)) == Decimal("333333")
