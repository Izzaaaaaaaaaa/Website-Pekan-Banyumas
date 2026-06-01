import uuid
from app.db.supabase import db_select, db_insert, db_update, db_delete
from app.schemas.promo import TambahPromoSchema, EditPromoSchema


def get_all_promo(artisan_id: str) -> list:
    return db_select("promo", filters={"artisan_id": artisan_id})


def tambah_promo(artisan_id: str, body: TambahPromoSchema) -> dict:
    data = {
        "id": str(uuid.uuid4()),
        "artisan_id": artisan_id,
        "nama": body.nama,
        "produk": body.produk,
        "diskon": body.diskon,
        "kategori": body.kategori,
        "deskripsi": body.deskripsi,
        "berlaku_start": body.berlaku_start,
        "berlaku_end": body.berlaku_end,
        "aktif": body.aktif,
    }
    return db_insert("promo", data)


def edit_promo(artisan_id: str, promo_id: str, body: EditPromoSchema) -> dict:
    item = db_select("promo", filters={"id": promo_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Promo tidak ditemukan")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    result = db_update("promo", {"id": promo_id}, update_data)
    return result[0] if result else {}


def hapus_promo(artisan_id: str, promo_id: str) -> dict:
    item = db_select("promo", filters={"id": promo_id, "artisan_id": artisan_id}, single=True)
    if not item:
        raise ValueError("Promo tidak ditemukan")

    db_delete("promo", {"id": promo_id})
    return {"message": "Promo berhasil dihapus"}
