import uuid
from decimal import Decimal
from app.db.supabase import db_select, db_insert, db_update, db_delete
from app.schemas.kas import TambahKasSchema, EditKasSchema


def recompute_artisan_aggregates(artisan_id: str) -> None:
    """Recompute & PERSIST per-row saldo_after + artisans aggregates.

    Called after EVERY kas mutation. Decimal only — float is forbidden for
    money. Writes through the service-role client (db_update) by design.
    """
    rows = db_select("kas", filters={"artisan_id": artisan_id}) or []
    rows.sort(key=lambda r: (r.get("tgl", ""), r.get("created_at", "")))

    saldo = Decimal("0")
    masuk = Decimal("0")

    for r in rows:
        n = Decimal(str(r["nominal"]))
        saldo += n if r["jenis"] == "masuk" else -n
        if r["jenis"] == "masuk":
            masuk += n
        # Hanya update ke DB jika berbeda (hindari unnecessary write)
        if Decimal(str(r.get("saldo_after") or 0)) != saldo:
            db_update("kas", {"id": r["id"]}, {"saldo_after": str(saldo)})

    artisan = db_select("artisans", filters={"id": artisan_id}, single=True)
    komisi_persen = Decimal(str((artisan or {}).get("komisi_persen") or 0))
    komisi = (masuk * komisi_persen / 100).quantize(Decimal("0.01"))
    db_update(
        "artisans",
        {"id": artisan_id},
        {"total_penjualan": str(masuk), "komisi_terkumpul": str(komisi)},
    )


def _cari_stok_item(artisan_id: str, barang_id: str = None, barang: str = None):
    """Cari stok item by barang_id (prioritas) atau nama barang (fallback)."""
    if barang_id:
        item = db_select("stok", filters={"id": barang_id, "artisan_id": artisan_id}, single=True)
        if item:
            return item
    if barang:
        return db_select("stok", filters={"artisan_id": artisan_id, "nama": barang}, single=True)
    return None


def _sesuaikan_stok(artisan_id: str, stok_item: dict, delta: int) -> None:
    """
    Ubah stok sebesar delta (positif = tambah, negatif = kurangi).
    Stok tidak boleh negatif — floor di 0.
    Kirim notifikasi kritis jika perlu.
    """
    if not stok_item or delta == 0:
        return
    stok_lama = int(stok_item.get("stok", 0))
    stok_baru = max(0, stok_lama + delta)
    print(f"[KAS] sesuaikan stok '{stok_item['nama']}': {stok_lama} + ({delta}) = {stok_baru}")
    db_update("stok", {"id": stok_item["id"]}, {"stok": stok_baru})
    stok_min = stok_item.get("stok_min", 0)
    if stok_baru <= stok_min:
        try:
            from app.notif_helper import notif_stok_kritis
            notif_stok_kritis(
                artisan_id,
                stok_item["nama"],
                stok_baru,
                stok_min,
                stok_item.get("kategori", ""),
            )
        except Exception:
            pass


def _compute_saldo_after(rows: list) -> list:
    """
    Hitung saldo_after secara cumulative dari semua baris yang sudah diurutkan
    berdasarkan (tgl asc, created_at asc).

    Selalu derive on-the-fly — tidak bergantung pada nilai saldo_after di DB
    sehingga edit/hapus entri lama tidak pernah merusak running balance.
    """
    sorted_rows = sorted(
        rows,
        key=lambda x: (x.get("tgl", ""), x.get("created_at", "")),
    )
    running = 0.0
    for row in sorted_rows:
        nominal = float(row.get("nominal", 0))
        if row.get("jenis") == "masuk":
            running += nominal
        else:
            running -= nominal
        row["saldo_after"] = running
    return sorted_rows


def get_all_kas(artisan_id: str, jenis: str = None) -> list:
    """
    Kembalikan semua entri kas artisan dengan saldo_after yang selalu akurat.
    Filter jenis diterapkan SETELAH running balance dihitung dari data lengkap,
    supaya saldo per-baris tetap benar meskipun tabel difilter.
    """
    semua = db_select("kas", filters={"artisan_id": artisan_id})
    # hitung running balance dari data LENGKAP dulu
    semua_dengan_saldo = _compute_saldo_after(semua)
    # baru filter untuk response
    if jenis:
        return [d for d in semua_dengan_saldo if d.get("jenis") == jenis]
    return semua_dengan_saldo


def tambah_kas(artisan_id: str, body: TambahKasSchema) -> dict:
    data = {
        "id": str(uuid.uuid4()),
        "artisan_id": artisan_id,
        "jenis": body.jenis,
        "kategori": body.kategori,
        "pelanggan": body.pelanggan,
        "barang": body.barang,
        "qty": body.qty,
        "metode": body.metode,
        "ket": body.ket,
        "nominal": body.nominal,
        "tgl": body.tgl,
        "bukti_url": body.bukti_url,
    }
    result = db_insert("kas", data)

    # Inject saldo_after yang akurat ke response (dihitung dari data lengkap)
    semua = db_select("kas", filters={"artisan_id": artisan_id})
    semua_dengan_saldo = _compute_saldo_after(semua)
    inserted = next((r for r in semua_dengan_saldo if r["id"] == data["id"]), None)
    if inserted:
        result = inserted

    # jika masuk & ada barang → validasi & kurangi stok otomatis
    if body.jenis == "masuk" and body.qty:
        try:
            stok_item = _cari_stok_item(artisan_id, barang_id=body.barang_id, barang=body.barang)
            if stok_item:
                stok_tersedia = int(stok_item.get("stok", 0))
                qty_diminta   = int(body.qty)
                if qty_diminta > stok_tersedia:
                    # Rollback: hapus kas yang sudah di-insert
                    try:
                        db_delete("kas", {"id": data["id"]})
                    except Exception:
                        pass
                    raise ValueError(
                        f"Stok '{stok_item['nama']}' tidak mencukupi. "
                        f"Tersedia: {stok_tersedia}, diminta: {qty_diminta}."
                    )
                _sesuaikan_stok(artisan_id, stok_item, -qty_diminta)
        except ValueError:
            raise
        except Exception as e:
            print(f"[KAS ERROR] pengurangan stok gagal: {e}")

    # notifikasi transaksi baru
    if body.jenis == "masuk" and body.barang:
        try:
            from app.notif_helper import notif_transaksi_baru
            notif_transaksi_baru(
                artisan_id,
                trx_id=data["id"][:8].upper(),
                nilai=int(body.nominal),
                pelanggan=body.pelanggan or "",
                barang=body.barang,
            )
        except Exception:
            pass  # notifikasi gagal tidak boleh crash endpoint utama

    recompute_artisan_aggregates(artisan_id)
    return result


def edit_kas(artisan_id: str, kas_id: str, body: EditKasSchema) -> dict:
    item = db_select("kas", filters={"id": kas_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Data kas tidak ditemukan")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    # barang_id hanya untuk lookup stok — tidak ada di tabel kas, jangan di-update ke DB
    update_data.pop("barang_id", None)
    db_update("kas", {"id": kas_id}, update_data)

    # ── Sesuaikan stok jika ini pemasukan dengan barang ───────────────────────
    # Logika: kembalikan qty lama → kurangi qty baru
    try:
        jenis_lama = item.get("jenis")
        jenis_baru = update_data.get("jenis", jenis_lama)

        barang_id_lama = item.get("barang_id") or item.get("id")   # fallback ke id kas
        barang_lama    = item.get("barang")
        qty_lama       = int(item.get("qty") or 0)

        barang_baru = update_data.get("barang", barang_lama)
        qty_baru    = int(update_data.get("qty", qty_lama) or 0)

        # Tentukan stok item yang relevan
        # Prioritas: barang_id dari body edit > barang_id lama > fallback ke nama barang
        barang_id_baru = update_data.get("barang_id")
        stok_item = _cari_stok_item(
            artisan_id,
            barang_id=barang_id_baru or item.get("barang_id"),
            barang=barang_lama or barang_baru,
        )

        if stok_item:
            if jenis_lama == "masuk" and jenis_baru == "masuk":
                # Sama-sama masuk: net delta = qty_lama dikembalikan, qty_baru dikurangi
                # Validasi: stok + qty_lama (dikembalikan) harus >= qty_baru
                stok_sekarang = int(stok_item.get("stok", 0))
                stok_setelah_rollback = stok_sekarang + qty_lama
                if qty_baru > stok_setelah_rollback:
                    raise ValueError(
                        f"Stok '{stok_item['nama']}' tidak mencukupi. "
                        f"Tersedia setelah koreksi: {stok_setelah_rollback}, diminta: {qty_baru}."
                    )
                delta = qty_lama - qty_baru
                _sesuaikan_stok(artisan_id, stok_item, delta)

            elif jenis_lama == "masuk" and jenis_baru != "masuk":
                # Ganti dari masuk ke keluar/lainnya: kembalikan semua qty lama
                _sesuaikan_stok(artisan_id, stok_item, +qty_lama)

            elif jenis_lama != "masuk" and jenis_baru == "masuk":
                # Ganti dari bukan masuk ke masuk: validasi stok cukup
                stok_sekarang = int(stok_item.get("stok", 0))
                if qty_baru > stok_sekarang:
                    raise ValueError(
                        f"Stok '{stok_item['nama']}' tidak mencukupi. "
                        f"Tersedia: {stok_sekarang}, diminta: {qty_baru}."
                    )
                _sesuaikan_stok(artisan_id, stok_item, -qty_baru)
            # jenis_lama != masuk && jenis_baru != masuk → tidak ada efek stok
    except Exception as e:
        print(f"[KAS EDIT] penyesuaian stok gagal: {e}")

    # Kembalikan row dengan saldo_after yang sudah dihitung ulang dari data lengkap
    semua = db_select("kas", filters={"artisan_id": artisan_id})
    semua_dengan_saldo = _compute_saldo_after(semua)
    updated = next((r for r in semua_dengan_saldo if r["id"] == kas_id), None)
    recompute_artisan_aggregates(artisan_id)
    return updated or {}


def hapus_kas(artisan_id: str, kas_id: str) -> dict:
    item = db_select("kas", filters={"id": kas_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Data kas tidak ditemukan")

    # ── Kembalikan stok jika ini pemasukan dengan barang ─────────────────────
    try:
        if item.get("jenis") == "masuk" and item.get("barang"):
            qty = int(item.get("qty") or 0)
            stok_item = _cari_stok_item(artisan_id, barang_id=None, barang=item["barang"])
            if stok_item and qty > 0:
                # Hapus pemasukan = batalkan pengurangan stok → tambahkan kembali
                _sesuaikan_stok(artisan_id, stok_item, +qty)
    except Exception as e:
        print(f"[KAS HAPUS] pengembalian stok gagal: {e}")

    db_delete("kas", {"id": kas_id})
    recompute_artisan_aggregates(artisan_id)
    return {"message": "Data kas berhasil dihapus"}


def get_summary(artisan_id: str) -> dict:
    semua = db_select("kas", filters={"artisan_id": artisan_id})
    total_masuk  = sum(float(d["nominal"]) for d in semua if d["jenis"] == "masuk")
    total_keluar = sum(float(d["nominal"]) for d in semua if d["jenis"] == "keluar")
    return {
        "total_masuk": total_masuk,
        "total_keluar": total_keluar,
        "saldo": total_masuk - total_keluar,
    }
