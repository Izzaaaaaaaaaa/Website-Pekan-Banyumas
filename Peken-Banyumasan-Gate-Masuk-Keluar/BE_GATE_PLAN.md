# Gate BE — Action Plan

**Untuk: tim Gate Backend.** Self-contained — boleh attach ke AI kalian.

---

## 🔴 BUG-1 — Aktivasi admin tidak menyinkronkan `app_metadata.status` (BLOCKING)

### Gejala
Kolaborator/Artisan yang **sudah diaktifkan admin** tetap **tidak bisa login** — FE memunculkan "menunggu konfirmasi" terus, padahal di tabel DB statusnya sudah `aktif`.

### Akar masalah (terbukti dari kode + data live)
Ada **dua tempat penyimpanan status** yang tidak sinkron:
1. **Tabel DB** `kolaborators.status` / `artisans.status` — diupdate saat aktivasi.
2. **JWT claim** `auth.users.app_metadata.status` — di-set `'pending'` saat register, **TIDAK PERNAH diupdate** saat aktivasi.

FE membaca status dari **JWT claim** (`app_metadata.status`) → selamanya `pending` → blokir login.

Bukti:
- Register set `app_metadata.status='pending'` — Kolaborator `app/services/auth_service.py:55`, UMKM `app/services/auth_service.py:67`.
- Aktivasi **hanya update tabel**, tidak sentuh `app_metadata`:
  - `app/services/kolaborator_service.py:56-58` → `update_kolaborator(id, {"status": status})`
  - `app/services/artisan_service.py:58-60` → `update_artisan(id, {"status": status})`
- Tidak ada `auth.admin.update_user_by_id` untuk status (yang ada cuma di `petugas_service.py` untuk ban/password).
- **Data live**: user `1kolab@gmail.com` → `kolaborators.status = aktif` TAPI `app_metadata.status = pending`. ← bug nyata.

### Fix (Gate BE — kalian yang kerjakan)
Saat update status kolaborator/artisan, **juga sync `app_metadata`**.

`app/services/kolaborator_service.py` — `update_kolaborator_status`:
```python
def update_kolaborator_status(kolaborator_id: str, status: str):
    result = update_kolaborator(kolaborator_id, {"status": status})
    # SYNC app_metadata supaya JWT tidak basi (FE baca status dari sini)
    supabase_admin.auth.admin.update_user_by_id(
        kolaborator_id,
        {"app_metadata": {"role": "kolaborator", "status": status}},
    )
    return result
```

`app/services/artisan_service.py` — `update_artisan_status`: sama, dengan `"role": "artisan"`.

### ⚠️ Hati-hati
- **Sertakan `role`** saat menulis `app_metadata`. Cek apakah `update_user_by_id` me-**replace** atau me-**merge** `app_metadata`. Kalau replace dan kalian tulis tanpa `role`, maka `jwt_role()` di RLS rusak (user kehilangan role). Aman: selalu tulis `{"role": ..., "status": ...}`.
- User yang **sedang login** tetap bawa JWT lama sampai **re-login / token refresh**. Beri tahu user untuk login ulang setelah diaktifkan (atau ini wajar karena status berubah saat mereka belum login).

### Verifikasi (checklist)
1. Register kolaborator baru → status `pending` → login → halaman pending. ✅
2. Admin aktivasi via Gate (`PATCH /api/kolaborator/{id}/status` body `{"status":"aktif"}`).
3. Cek di Supabase: `app_metadata.status` user itu **sudah `aktif`** (bukan cuma tabel).
4. Logout → login lagi → **masuk dashboard**. ✅
5. Refresh halaman → **tetap di dashboard** (tidak balik ke pending). ✅
6. **Ulang untuk artisan** — bug-nya identik (cek `app/services/artisan_service.py`).

### Catatan lintas-tim
Bug ini **memblokir login** di portal **Kolaborator DAN UMKM**, tapi **fix-nya 100% di Gate BE** (kalian yang punya endpoint aktivasi). Tim Kolaborator/UMKM tidak perlu ubah apa-apa untuk bug ini.

### Alternatif (kalau mau lebih "benar arsitektur", opsional)
Daripada sync 2 tempat, jadikan **tabel** sebagai satu-satunya sumber kebenaran: setiap backend baca `status` dari tabel (`kolaborators`/`artisans`) saat login/me, bukan dari `app_metadata`. Tapi ini menyentuh 3 BE — opsi sync di atas lebih kecil & cukup.
