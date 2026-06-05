import uuid
from app.db.supabase import db_select, db_insert, db_update, db_delete
from app.schemas.stok import TambahStokSchema, EditStokSchema


def get_all_stok(artisan_id: str) -> list:
    return db_select("stok", filters={"artisan_id": artisan_id})


def tambah_stok(artisan_id: str, body: TambahStokSchema) -> dict:
    data = {
        "id": str(uuid.uuid4()),
        "artisan_id": artisan_id,
        "nama": body.nama,
        "harga": body.harga,
        "stok": body.stok,
        "kategori": body.kategori,
        "satuan": body.satuan,
        "deskripsi": body.deskripsi,
        "stok_min": body.stok_min,
    }
    result = db_insert("stok", data)

    # buat notifikasi jika langsung kritis saat ditambah
    if body.stok <= body.stok_min:
        try:
            from app.notif_helper import notif_stok_kritis
            notif_stok_kritis(artisan_id, body.nama, body.stok, body.stok_min, body.kategori)
        except Exception:
            pass  # notifikasi gagal tidak boleh crash endpoint utama

    return result


def edit_stok(artisan_id: str, stok_id: str, body: EditStokSchema) -> dict:
    item = db_select("stok", filters={"id": stok_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Barang tidak ditemukan")

    # ambil semua field yang dikirim (termasuk nilai 0)
    update_data = {k: v for k, v in body.model_dump(exclude_unset=False).items() if v is not None}
    
    # pastikan stok dan stok_min selalu masuk meski nilainya 0
    raw = body.model_dump()
    if raw.get("stok") is not None:
        update_data["stok"] = raw["stok"]
    if raw.get("stok_min") is not None:
        update_data["stok_min"] = raw["stok_min"]
    result = db_update("stok", {"id": stok_id}, update_data)

    # cek stok kritis setelah update
    updated = result[0] if result else item
    stok_baru = update_data.get("stok", item["stok"])
    stok_min  = update_data.get("stok_min", item["stok_min"])
    print(f"[STOK DEBUG] stok_baru={stok_baru}, stok_min={stok_min}, kritis={stok_baru <= stok_min}")
    if stok_baru <= stok_min:
        try:
            from app.notif_helper import notif_stok_kritis
            notif_stok_kritis(artisan_id, updated.get("nama", item["nama"]), stok_baru, stok_min, updated.get("kategori", item["kategori"]))
        except Exception as e:
            print(f"[NOTIF ERROR] stok kritis: {e}")

    return updated


def hapus_stok(artisan_id: str, stok_id: str) -> dict:
    item = db_select("stok", filters={"id": stok_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Barang tidak ditemukan")

    db_delete("stok", {"id": stok_id})
    return {"message": "Barang berhasil dihapus"}


def get_stok_kritis(artisan_id: str) -> list:
    """Kembalikan barang yang stok <= stok_min."""
    semua = db_select("stok", filters={"artisan_id": artisan_id})
    return [i for i in semua if i["stok"] <= i.get("stok_min", 0)]
