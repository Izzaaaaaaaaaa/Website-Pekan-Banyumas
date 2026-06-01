import os
import uuid
import bcrypt
from datetime import datetime, timedelta
from jose import jwt

from app.db.supabase import db_select, db_insert, db_update
from app.schemas.auth import LoginSchema, RegisterSchema, ChangePasswordSchema


JWT_SECRET     = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM  = "HS256"
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


# ── JWT ───────────────────────────────────────────────────────────────────────
def create_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MIN)
    payload = {"sub": user_id, "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ── PASSWORD ──────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── LOGIN ─────────────────────────────────────────────────────────────────────
def login(body: LoginSchema) -> dict:
    """
    Cek di tabel users_profile untuk role, lalu artisans untuk password_hash.
    artisans.status harus 'aktif' — 'pending' ditolak.
    """
    artisan = db_select("artisans", filters={"email": body.email}, single=True)
    if not artisan:
        raise ValueError("Email tidak ditemukan")

    if not verify_password(body.password, artisan["password_hash"]):
        raise ValueError("Password salah")

    if artisan.get("status") == "pending":
        raise ValueError("Akun belum disetujui admin")

    if artisan.get("status") == "suspended":
        raise ValueError("Akun kamu sedang disuspend, hubungi admin")

    if artisan.get("status") == "rejected":
        raise ValueError("Pendaftaran akun ditolak, hubungi admin")

    # ambil role dari users_profile
    profile = db_select("users_profile", filters={"id": artisan["id"]}, single=True)
    role = profile["role"] if profile else "artisan"

    token = create_token(artisan["id"], artisan["email"], role)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": artisan["id"],
        "nama": artisan["pemilik"],
        "email": artisan["email"],
        "role": role,
    }


# ── REGISTER ──────────────────────────────────────────────────────────────────
def register(body: RegisterSchema) -> dict:
    """
    Insert ke tabel artisans + users_profile.
    username harus unik (DB UNIQUE constraint).
    status default 'pending' — menunggu persetujuan admin.
    """
    # cek email
    if db_select("artisans", filters={"email": body.email}, single=True):
        raise ValueError("Email sudah terdaftar")

    # cek username
    if db_select("artisans", filters={"username": body.username}, single=True):
        raise ValueError("Username sudah dipakai")

    if len(body.password) < 6:
        raise ValueError("Password minimal 6 karakter")

    user_id = str(uuid.uuid4())

    # insert ke users_profile DULU (karena artisans.id FK ke users_profile.id)
    profile_data = {
        "id": user_id,
        "nama": body.pemilik,
        "role": "artisan",
    }
    db_insert("users_profile", profile_data)

    # insert ke artisans
    # slug di-auto-generate oleh trigger trg_artisans_slug dari nama_usaha
    artisan_data = {
        "id": user_id,
        "email": body.email,
        "username": body.username.lower(),
        "nama_usaha": body.nama_usaha,
        "pemilik": body.pemilik,
        "no_hp": body.no_hp or "",
        "kota": body.kota or "",
        "deskripsi": body.deskripsi or "",
        "kategori_usaha": body.kategori_usaha,
        "password_hash": hash_password(body.password),
        "status": "pending",
    }
    db_insert("artisans", artisan_data)

    return {"message": "Pendaftaran berhasil, menunggu persetujuan admin"}


# ── GANTI PASSWORD (dari halaman Pengaturan) ──────────────────────────────────
def change_password(user_id: str, body: ChangePasswordSchema) -> dict:
    artisan = db_select("artisans", filters={"id": user_id}, single=True)
    if not artisan:
        raise ValueError("User tidak ditemukan")

    if not verify_password(body.password_lama, artisan["password_hash"]):
        raise ValueError("Password lama tidak sesuai")

    if body.password_baru != body.konfirmasi:
        raise ValueError("Konfirmasi password tidak cocok")

    if len(body.password_baru) < 6:
        raise ValueError("Password baru minimal 6 karakter")

    db_update("artisans", {"id": user_id}, {"password_hash": hash_password(body.password_baru)})
    return {"message": "Password berhasil diubah"}


# ── RESET PASSWORD via OTP (Lupa Password) ───────────────────────────────────
def reset_password(phone: str, code: str, new_password: str) -> dict:
    """
    Verifikasi OTP dari tabel otp_codes (purpose='password_reset').
    Setelah valid, update password artisan dan tandai OTP sebagai used.
    """
    from datetime import timezone
    now = datetime.now(timezone.utc)

    otp_record = db_select("otp_codes", filters={"phone": phone, "code": code, "purpose": "password_reset"}, single=True)

    if not otp_record:
        raise ValueError("Kode OTP tidak valid")

    if otp_record.get("used_at"):
        raise ValueError("Kode OTP sudah dipakai")

    # cek expired
    expires_at = otp_record.get("expires_at")
    if expires_at:
        from datetime import datetime as dt
        exp = dt.fromisoformat(expires_at.replace("Z", "+00:00"))
        if now > exp:
            raise ValueError("Kode OTP sudah kadaluarsa")

    artisan = db_select("artisans", filters={"no_hp": phone}, single=True)
    if not artisan:
        raise ValueError("Nomor HP tidak terdaftar")

    if len(new_password) < 6:
        raise ValueError("Password minimal 6 karakter")

    db_update("artisans", {"id": artisan["id"]}, {"password_hash": hash_password(new_password)})
    db_update("otp_codes", {"id": otp_record["id"]}, {"used_at": now.isoformat()})

    return {"message": "Password berhasil direset"}
