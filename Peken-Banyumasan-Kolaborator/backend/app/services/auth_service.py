from app.core.hash import hash_password, verify_password
from app.core.security import create_access_token
from app.db.supabase import supabase


def login_user(email: str, password: str) -> dict:
    result = supabase.table("users").select("*").eq("email", email).limit(1).execute()
    if not result.data:
        return {"error": "User tidak ditemukan"}

    user = result.data[0]
    if not verify_password(password, user.get("password", "")):
        return {"error": "Password salah"}

    token = create_access_token({
        "user_id": user.get("id"),
        "role": user.get("role", "kolaborator"),
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "nama": user.get("nama"),
            "role": user.get("role", "kolaborator"),
            "status": "aktif" if user.get("is_verified") else "pending",
        },
    }


def register_user(payload: dict) -> dict:
    email = payload.get("email")
    if not email:
        return {"error": "Email wajib diisi"}

    existing = supabase.table("users").select("id").eq("email", email).limit(1).execute()
    if existing.data:
        return {"error": "Email sudah terdaftar"}

    password = payload.get("password")
    if not password:
        return {"error": "Password wajib diisi"}

    role = payload.get("role", "kolaborator")
    user = {
        "nama": payload.get("nama"),
        "email": email,
        "password": hash_password(password),
        "role": role,
        "is_verified": False,
    }
    result = supabase.table("users").insert(user).execute()
    if not result.data:
        return {"error": "Gagal membuat akun"}

    return {
        "message": "Pendaftaran berhasil dikirim",
        "status": "pending",
    }
