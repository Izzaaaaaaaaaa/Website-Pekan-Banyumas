from app.db.supabase import supabase
from app.core.hash import verify_password
from app.core.security import create_access_token

def login_user(email: str, password: str):
    user = supabase.table("users") \
        .select("*") \
        .eq("email", email) \
        .execute()

    if not user.data:
        return {"error": "User tidak ditemukan"}

    user = user.data[0]

    if not verify_password(password, user["password"]):
        return {"error": "Password salah"}

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