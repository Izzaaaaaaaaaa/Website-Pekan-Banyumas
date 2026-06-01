from app.db.supabase import db_select, db_update
from app.schemas.pengaturan import UpdateProfilSchema, UpdateQrisSchema


# Field yang TIDAK boleh diupdate artisan sendiri (admin-only)
_PROTECTED_FIELDS = {
    "komisi_persen", "total_penjualan", "komisi_terkumpul",
    "internal_notes", "status", "slug", "id",
}


def get_profil(artisan_id: str) -> dict:
    artisan = db_select("artisans", filters={"id": artisan_id}, single=True)
    if not artisan:
        raise ValueError("Artisan tidak ditemukan")

    # hapus field sensitif sebelum return ke artisan sendiri
    artisan.pop("password_hash", None)
    artisan.pop("internal_notes", None)
    artisan.pop("total_penjualan", None)
    artisan.pop("komisi_terkumpul", None)
    artisan.pop("komisi_persen", None)
    return artisan


def update_profil(artisan_id: str, body: UpdateProfilSchema) -> dict:
    artisan = db_select("artisans", filters={"id": artisan_id}, single=True)
    if not artisan:
        raise ValueError("Artisan tidak ditemukan")

    update_data = {
        k: v
        for k, v in body.model_dump().items()
        if v is not None and k not in _PROTECTED_FIELDS
    }
    if not update_data:
        raise ValueError("Tidak ada data yang diubah")

    result = db_update("artisans", {"id": artisan_id}, update_data)
    return result[0] if result else {}


def update_qris(artisan_id: str, body: UpdateQrisSchema) -> dict:
    """
    Update artisans.qris_url.
    DB trigger trg_artisans_qris_ts otomatis set qris_updated_at.
    Return { qris_url, updated_at } sesuai OpenAPI artisan yaml 830–842.
    """
    result = db_update("artisans", {"id": artisan_id}, {"qris_url": body.qris_url})
    updated = result[0] if result else {}
    return {
        "qris_url": updated.get("qris_url", body.qris_url),
        "updated_at": updated.get("qris_updated_at", ""),
    }


def hapus_qris(artisan_id: str) -> dict:
    db_update("artisans", {"id": artisan_id}, {"qris_url": None})
    return {"message": "QRIS berhasil dihapus"}
