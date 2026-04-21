from app.core.hash import verify_password
from app.core.security import create_access_token
from app.db.supabase import supabase


def login_user(email: str, password: str) -> dict:
    result = supabase.table("users").select("*").eq("email", email).limit(1).execute()
    if not result.data:
        return {"error": "User tidak ditemukan"}

    user = result.data[0]
    if not verify_password(password, user.get("password", "")):
        return {"error": "Password salah"}

    token = create_access_token(
        {
            "user_id": user.get("id"),
            "role": user.get("role", "kolaborator"),
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "nama": user.get("nama"),
            "role": user.get("role", "kolaborator"),
        },
    }
