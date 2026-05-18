import os

from supabase import create_client

from app.core.config import SUPABASE_URL
from app.db.supabase import supabase
from fastapi import HTTPException

EMAIL_NOT_REGISTERED = "EMAIL_NOT_REGISTERED"
WRONG_PASSWORD = "WRONG_PASSWORD"

_supabase_admin = None


def get_supabase_admin():
    global _supabase_admin

    if _supabase_admin is None:
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not SUPABASE_URL or not service_role_key:
            raise RuntimeError("Supabase service role key belum dikonfigurasi")

        _supabase_admin = create_client(SUPABASE_URL, service_role_key)

    return _supabase_admin


def check_user_exists(email: str):
    try:
        admin_client = get_supabase_admin()
        normalized_email = email.strip().lower()
        page = 1
        per_page = 1000

        while True:
            users_response = admin_client.auth.admin.list_users(
                page=page,
                per_page=per_page
            )
            users = getattr(users_response, "users", users_response)

            for user in users:
                user_email = getattr(user, "email", None)

                if user_email and user_email.lower() == normalized_email:
                    return True

            if len(users) < per_page:
                return False

            page += 1
    except Exception as exc:
        raise RuntimeError(
            "Gagal memeriksa user Supabase Auth menggunakan service role key"
        ) from exc


def login_user(email: str, password: str):
    is_exists = check_user_exists(email)

    if not is_exists:
        raise Exception(EMAIL_NOT_REGISTERED)

    try:
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        return response
    except Exception:
        raise Exception(WRONG_PASSWORD)


def update_profile(user_id: str, data: dict):
    """
    Update custom profile fields in users_profile table.
    Nama/email are handled by Supabase auth client on frontend.
    """
    try:
        # Filter out None/empty values
        update_data = {k: v for k, v in data.items() if v is not None}

        if not update_data:
            return {"message": "Tidak ada data yang diupdate"}

        res = supabase.table("users_profile") \
            .update(update_data) \
            .eq("id", user_id) \
            .execute()

        if not res.data:
            raise HTTPException(404, "User tidak ditemukan")

        return {"message": "Profile berhasil diupdate"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating profile: {str(e)}")
