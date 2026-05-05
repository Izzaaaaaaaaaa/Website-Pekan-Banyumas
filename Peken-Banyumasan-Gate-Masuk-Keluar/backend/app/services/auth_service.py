from app.db.supabase import supabase
from app.core.hash import verify_password, hash_password
from app.core.security import create_access_token
from fastapi import HTTPException


# 🔐 LOGIN (SUDAH BAGUS, TETAP)
def login_user(email: str, password: str):
    user = supabase.table("users_profile") \
        .select("*") \
        .eq("email", email) \
        .execute()

    if not user.data:
        raise HTTPException(404, "User tidak ditemukan")

    user = user.data[0]

    if not verify_password(password, user["password"]):
        raise HTTPException(400, "Password salah")

    token = create_access_token({
        "user_id": user["id"],
        "role": user["role"]
    })

    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "nama": user["nama"],
            "role": user["role"]
        }
    }


# 🔥 GET CURRENT USER
def get_me(user_id: str):
    res = supabase.table("users_profile") \
        .select("id, nama, email, role") \
        .eq("id", user_id) \
        .single() \
        .execute()

    if not res.data:
        raise HTTPException(404, "User tidak ditemukan")

    return res.data


# 🔥 UPDATE PROFILE
def update_profile(user_id: str, nama: str):
    supabase.table("users_profile") \
        .update({"nama": nama}) \
        .eq("id", user_id) \
        .execute()

    return {"message": "Profile berhasil diupdate"}


# 🔥 UPDATE PASSWORD
def update_password(user_id: str, old_password: str, new_password: str):
    supabase.table("users_profile") \
        .select("*") \
        .eq("id", user_id) \
        .single() \
        .execute()

    if not user.data:
        raise HTTPException(404, "User tidak ditemukan")

    # cek password lama
    if not verify_password(old_password, user.data["password"]):
        raise HTTPException(400, "Password lama salah")

    # hash password baru
    new_hashed = hash_password(new_password)

    supabase.table("users_profile") \
        .update({"password": new_hashed}) \
        .eq("id", user_id) \
        .execute()

    return {"message": "Password berhasil diupdate"}