"""
auth_service.py — Artisan auth via Supabase Auth (UMKM-2).

Login / forgot-password / reset-password semuanya Supabase-direct di FE.
Backend hanya menangani:
  - register()       : Supabase Admin create_user + insert artisans + users_profile
  - change_password(): proxy ke supabase.auth.admin.update_user_by_id (ganti pw dari Pengaturan)
"""

import re
import uuid

from app.db.supabase import db_select, db_insert, db_delete, supabase_admin
from app.schemas.auth import RegisterSchema, ChangePasswordSchema


# ── SLUG HELPER ───────────────────────────────────────────────────────────────
def _generate_slug(nama_usaha: str, user_id: str) -> str:
    base = nama_usaha.lower().strip()
    base = re.sub(r"[^a-z0-9\s-]", "", base)
    base = re.sub(r"\s+", "-", base)
    base = re.sub(r"-+", "-", base).strip("-")
    if not base:
        base = "artisan"
    slug = base
    existing = db_select("artisans", filters={"slug": slug}, single=True)
    if existing:
        slug = f"{base}-{user_id[:8]}"
    return slug


# ── REGISTER ──────────────────────────────────────────────────────────────────
def register(body: RegisterSchema) -> dict:
    """
    Daftarkan artisan baru secara atomik:
      1. Validasi duplikat (email + username)
      2. Buat Supabase Auth user via Admin SDK
         (app_metadata: role='artisan', status='pending')
      3. Insert users_profile
      4. Insert artisans
    Rollback bertahap jika langkah 3 atau 4 gagal.
    """
    if not supabase_admin:
        raise ValueError("Server belum dikonfigurasi (service role key tidak tersedia)")

    # ── Validasi input ─────────────────────────────────────────────────────────
    username = body.username.strip().lower()
    if len(username) < 4:
        raise ValueError("Username minimal 4 karakter")
    if len(username) > 30:
        raise ValueError("Username maksimal 30 karakter")
    # Must match the DB CHECK constraint `artisans_username_check`
    # (^[a-z0-9][a-z0-9_-]{1,30}[a-z0-9]$): start & end alphanumeric; lowercase
    # letters, digits, underscore, or hyphen in between.
    if not re.match(r'^[a-z0-9][a-z0-9_-]*[a-z0-9]$', username):
        raise ValueError("Username harus diawali & diakhiri huruf kecil/angka; hanya huruf kecil, angka, underscore (_), atau strip (-)")
    if len(body.password) < 6:
        raise ValueError("Password minimal 6 karakter")

    # ── Cek duplikat di tabel artisans ─────────────────────────────────────────
    if db_select("artisans", filters={"email": body.email}, single=True):
        raise ValueError("Email sudah terdaftar")
    if db_select("artisans", filters={"username": username}, single=True):
        raise ValueError("Username sudah dipakai")

    # ── Step 1: Buat Supabase Auth user ───────────────────────────────────────
    try:
        auth_resp = supabase_admin.auth.admin.create_user({
            "email":         body.email,
            "password":      body.password,
            "email_confirm": True,   # skip email verification — status dikontrol admin
            "app_metadata": {
                "role":   "artisan",
                "status": "pending",
            },
            "user_metadata": {
                "nama": body.pemilik,
            },
        })
    except Exception as e:
        err_str = str(e)
        if "already" in err_str.lower() or "duplicate" in err_str.lower():
            raise ValueError("Email sudah terdaftar")
        raise ValueError(f"Gagal membuat akun: {err_str}")

    user = auth_resp.user
    if not user:
        raise ValueError("Gagal membuat akun Supabase")

    user_id = user.id
    slug    = _generate_slug(body.nama_usaha, user_id)

    # ── Step 2: Insert users_profile ──────────────────────────────────────────
    try:
        supabase_admin.table("users_profile").insert({
            "id":   user_id,
            "nama": body.pemilik,
            "role": "artisan",
        }).execute()
    except Exception as e:
        # rollback: hapus Supabase Auth user
        try:
            supabase_admin.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise ValueError(f"Gagal membuat profil: {str(e)}")

    # ── Step 3: Insert artisans ────────────────────────────────────────────────
    artisan_data = {
        "id":            user_id,
        "email":         body.email,
        "username":      username,
        "nama_usaha":    body.nama_usaha,
        "pemilik":       body.pemilik,
        "no_hp":         body.no_hp or "",
        "kota":          body.kota or "",
        "deskripsi":     body.deskripsi or "",
        "kategori_usaha": body.kategori_usaha,
        "status":        "pending",
        "slug":          slug,
    }
    try:
        supabase_admin.table("artisans").insert(artisan_data).execute()
    except Exception as e:
        # rollback: hapus users_profile + Supabase Auth user
        try:
            supabase_admin.table("users_profile").delete().eq("id", user_id).execute()
        except Exception:
            pass
        try:
            supabase_admin.auth.admin.delete_user(user_id)
        except Exception:
            pass
        err_str = str(e)
        if "username_check" in err_str:
            raise ValueError("Username tidak memenuhi syarat (min 4 karakter, huruf/angka/underscore)")
        if "23505" in err_str or "unique" in err_str.lower():
            raise ValueError("Email atau username sudah terdaftar")
        raise ValueError("Pendaftaran gagal, coba lagi")

    return {"message": "Pendaftaran berhasil, menunggu persetujuan admin"}


# ── GANTI PASSWORD (dari halaman Pengaturan) ──────────────────────────────────
def change_password(user_id: str, body: ChangePasswordSchema) -> dict:
    """
    Ganti password via Supabase Admin update_user_by_id.
    Verifikasi 'password_lama' tidak bisa dilakukan dari BE karena bcrypt
    sudah dihapus — FE harus re-authenticate dulu dengan signInWithPassword
    sebelum memanggil endpoint ini, atau gunakan supabase.auth.updateUser langsung.
    """
    if not supabase_admin:
        raise ValueError("Server belum dikonfigurasi")

    if body.password_baru != body.konfirmasi:
        raise ValueError("Konfirmasi password tidak cocok")
    if len(body.password_baru) < 6:
        raise ValueError("Password baru minimal 6 karakter")

    try:
        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"password": body.password_baru},
        )
    except Exception as e:
        raise ValueError(f"Gagal mengubah password: {str(e)}")

    return {"message": "Password berhasil diubah"}
