# Kolaborator BE — Action Plan

**Untuk: tim Kolaborator Backend.**

## TL;DR: tidak ada perubahan kode WAJIB dari audit ini. ✅

Hasil audit untuk domain kalian sebagian besar **sehat**. Tidak ada bug yang root-cause-nya di kode Kolaborator BE.

## Yang terbukti BAIK di domain kalian
- **Register atomik** ✓ — `app/services/auth_service.py` punya rollback penuh (gagal insert users_profile → hapus auth user; gagal insert kolaborators → hapus users_profile + auth user). Bagus, jangan diubah.
- **RLS kolaborator_requests, notifikasi** → anon dapat 0 row (benar).
- **Event draft tidak bocor** ke publik.

## Konteks bug yang MENYENTUH kalian tapi BUKAN tugas kalian

### Login user aktif tetap "menunggu konfirmasi" (BUG-1)
- Ini **dikerjakan tim Gate BE** (lihat `GATE.md`). Penyebabnya: aktivasi admin (di Gate) tidak menyinkronkan `app_metadata.status`, jadi JWT basi.
- **Kalian tidak perlu ubah apa-apa.** Tapi pahami: kalau ada laporan "sudah diaktifkan kok tetap pending", itu bug Gate, bukan kalian.
- Catatan: register kalian set `app_metadata.status='pending'` (`auth_service.py:55`) — itu **benar**. Yang kurang adalah sync saat aktivasi (sisi Gate).

## 2 hal untuk DIVERIFIKASI (bukan fix, cuma cek)

1. **Response `GET /api/kolaborator/me` apakah mengembalikan field `status`?**
   FE mungkin perlu status asli dari tabel (bukan JWT). Pastikan handler `me` (`app/api/routes/kolaborator.py:90`) mengembalikan `status` di payload. Kalau belum, pertimbangkan menambahkannya (read-only, aman) — ini bisa jadi solusi alternatif BUG-1 dari sisi data.

2. **Konsistensi envelope** `{status, message, data}` di semua endpoint kalian (sudah terlihat benar di `_envelope`, tapi pastikan tidak ada endpoint yang lupa membungkus) — FE bergantung pada bentuk ini.

## Yang BELUM diaudit (butuh BE jalan)
Logika bisnis end-to-end: event-apply (`event_service.py`), portofolio/story CRUD, notifikasi. Belum dites karena backend belum di-deploy. Kalau mau dites mendalam, jalankan lokal + minta audit lanjutan.
