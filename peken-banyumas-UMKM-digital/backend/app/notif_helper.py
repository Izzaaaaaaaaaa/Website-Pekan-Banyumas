"""
notif_helper.py
Helper notifikasi otomatis untuk artisan.
Type yang valid untuk artisan:
  artisan_request_approved | artisan_request_rejected
  position_change_approved | position_change_rejected
  event_starting_soon | system
"""

from app.services.notifikasi_service import create_notifikasi


def notif_stok_kritis(user_id: str, nama_barang: str, stok_sisa: int, stok_min: int, kategori: str = ""):
    create_notifikasi(
        user_id=user_id,
        notif_type="system",
        title=f"Stok {nama_barang} Hampir Habis",
        message=f"Sisa {stok_sisa} — di bawah batas minimum ({stok_min}). Segera lakukan restok.",
        link="/stok",
        detail={
            "produk": nama_barang,
            "stokSisa": f"{stok_sisa} pcs",
            "stokMinimum": f"{stok_min} pcs",
            "kategori": kategori,
        },
    )


def notif_transaksi_baru(user_id: str, trx_id: str, nilai: int, pelanggan: str, barang: str):
    nilai_fmt = f"Rp {nilai:,}".replace(",", ".")
    create_notifikasi(
        user_id=user_id,
        notif_type="system",
        title="Transaksi Baru Berhasil",
        message=f"Transaksi #{trx_id} senilai {nilai_fmt} berhasil diproses.",
        link="/kas",
        detail={
            "idTrx": f"#{trx_id}",
            "nilai": nilai_fmt,
            "pelanggan": pelanggan or "—",
            "barang": barang,
            "status": "Selesai",
        },
    )


def notif_request_approved(user_id: str, nama_event: str, posisi: str):
    create_notifikasi(
        user_id=user_id,
        notif_type="artisan_request_approved",
        title="Pendaftaran Event Disetujui",
        message=f"Kamu resmi terdaftar di {nama_event} — Stand {posisi}.",
        link="/event",
        detail={"event": nama_event, "stand": posisi},
    )


def notif_request_rejected(user_id: str, nama_event: str):
    create_notifikasi(
        user_id=user_id,
        notif_type="artisan_request_rejected",
        title="Pendaftaran Event Ditolak",
        message=f"Pendaftaran ke {nama_event} tidak disetujui. Hubungi admin.",
        link="/event",
        detail={"event": nama_event},
    )


def notif_position_change_approved(user_id: str, nama_event: str, posisi_baru: str):
    create_notifikasi(
        user_id=user_id,
        notif_type="position_change_approved",
        title="Perubahan Stand Disetujui",
        message=f"Posisi stand kamu di {nama_event} berhasil diubah ke {posisi_baru}.",
        link="/event",
        detail={"event": nama_event, "stand_baru": posisi_baru},
    )


def notif_position_change_rejected(user_id: str, nama_event: str):
    create_notifikasi(
        user_id=user_id,
        notif_type="position_change_rejected",
        title="Perubahan Stand Ditolak",
        message=f"Permintaan ubah posisi stand di {nama_event} tidak disetujui.",
        link="/event",
        detail={"event": nama_event},
    )
