from app.db.supabase import db_select


def get_all_riwayat(artisan_id: str) -> list:
    """
    Riwayat transaksi = semua kas dengan jenis='masuk'.
    Tidak ada tabel riwayat terpisah — data ada di tabel kas.
    """
    semua = db_select("kas", filters={"artisan_id": artisan_id})
    masuk = [d for d in semua if d.get("jenis") == "masuk"]
    # mapping ke shape RiwayatItem
    return [
        {
            "id": d["id"],
            "artisan_id": d["artisan_id"],
            "pelanggan": d.get("pelanggan") or "",
            "barang": d.get("barang") or "",
            "qty": d.get("qty", 1),
            "total": d.get("nominal", 0),
            "metode": d.get("metode", "tunai"),
            "tgl": d.get("tgl", ""),
            "created_at": d.get("created_at"),
        }
        for d in masuk
    ]
