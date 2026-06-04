import uuid
from app.db.supabase import db_select, db_insert, db_update, db_delete
from app.schemas.kas import TambahKasSchema, EditKasSchema


def _hitung_saldo_terakhir(artisan_id: str) -> float:
    """Ambil saldo_after dari entri kas terbaru milik artisan."""
    semua = db_select("kas", filters={"artisan_id": artisan_id})
    if not semua:
        return 0.0
    # urutkan berdasarkan created_at descending, ambil saldo_after pertama
    sorted_data = sorted(semua, key=lambda x: x.get("created_at", ""), reverse=True)
    return float(sorted_data[0].get("saldo_after", 0))


def get_all_kas(artisan_id: str, jenis: str = None) -> list:
    data = db_select("kas", filters={"artisan_id": artisan_id})
    if jenis:
        data = [d for d in data if d.get("jenis") == jenis]
    return data


def tambah_kas(artisan_id: str, body: TambahKasSchema) -> dict:
    last_saldo = _hitung_saldo_terakhir(artisan_id)
    saldo_after = (
        last_saldo + body.nominal
        if body.jenis == "masuk"
        else last_saldo - body.nominal
    )

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
        "saldo_after": saldo_after,
        "bukti_url": body.bukti_url,
    }
    result = db_insert("kas", data)

    # jika masuk & ada barang → kurangi stok otomatis
    if body.jenis == "masuk" and body.qty:
        try:
            stok_item = None
            # prioritas: cari by barang_id (lebih akurat)
            if body.barang_id:
                stok_item = db_select("stok", filters={"id": body.barang_id, "artisan_id": artisan_id}, single=True)
                print(f"[KAS] lookup by barang_id={body.barang_id} → {'ditemukan' if stok_item else 'TIDAK ditemukan'}")
            # fallback: cari by nama jika barang_id tidak ada
            if not stok_item and body.barang:
                stok_item = db_select("stok", filters={"artisan_id": artisan_id, "nama": body.barang}, single=True)
                print(f"[KAS] lookup by nama='{body.barang}' → {'ditemukan' if stok_item else 'TIDAK ditemukan'}")

            if stok_item:
                stok_lama = int(stok_item.get("stok", 0))
                stok_baru = max(0, stok_lama - int(body.qty))
                print(f"[KAS] kurangi stok '{stok_item['nama']}': {stok_lama} - {int(body.qty)} = {stok_baru}")
                db_update("stok", {"id": stok_item["id"]}, {"stok": stok_baru})
                # notifikasi stok kritis jika perlu
                stok_min = stok_item.get("stok_min", 0)
                if stok_baru <= stok_min:
                    from app.notif_helper import notif_stok_kritis
                    notif_stok_kritis(
                        artisan_id,
                        stok_item["nama"],
                        stok_baru,
                        stok_min,
                        stok_item.get("kategori", ""),
                    )
        except Exception as e:
            print(f"[KAS ERROR] pengurangan stok gagal: {e}")
            pass  # pengurangan stok gagal tidak boleh crash endpoint kas

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

    return result


def edit_kas(artisan_id: str, kas_id: str, body: EditKasSchema) -> dict:
    item = db_select("kas", filters={"id": kas_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Data kas tidak ditemukan")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    result = db_update("kas", {"id": kas_id}, update_data)
    return result[0] if result else {}


def hapus_kas(artisan_id: str, kas_id: str) -> dict:
    item = db_select("kas", filters={"id": kas_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Data kas tidak ditemukan")

    db_delete("kas", {"id": kas_id})
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
