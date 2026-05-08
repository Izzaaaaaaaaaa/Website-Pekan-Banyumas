from app.db.supabase import supabase
from fastapi import HTTPException

def login_user(email: str, password: str):

    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    return response


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
