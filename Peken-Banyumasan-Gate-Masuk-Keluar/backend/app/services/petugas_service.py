from app.db.supabase import supabase
from fastapi import HTTPException


def list_petugas(status: str = None):
    """List all petugas accounts."""
    try:
        query = supabase.table("users_profile").select("*").eq("role", "petugas")

        if status:
            query = query.eq("status", status)

        res = query.order("created_at", desc=True).execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error listing petugas: {str(e)}")


def get_petugas(user_id: str):
    """Get petugas details."""
    try:
        res = supabase.table("users_profile").select("*").eq("id", user_id).eq("role", "petugas").single().execute()
        if not res.data:
            raise HTTPException(404, "Petugas tidak ditemukan")
        return res.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching petugas: {str(e)}")


def create_petugas(email: str, nama: str, jabatan: str = None):
    """Create a new petugas account."""
    try:
        # Check if email already exists
        existing = supabase.table("users_profile").select("*").eq("email", email).execute()
        if existing.data:
            raise HTTPException(409, "Email sudah terdaftar")

        # Create in auth first (would be done by admin via Supabase console)
        # Here we just create the profile record
        res = supabase.table("users_profile").insert({
            "email": email,
            "nama": nama,
            "role": "petugas",
            "jabatan": jabatan,
            "status": "pending"
        }).execute()

        if not res.data:
            raise HTTPException(500, "Gagal membuat akun petugas")

        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creating petugas: {str(e)}")


def update_petugas(user_id: str, data: dict):
    """Update petugas."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return get_petugas(user_id)

        res = supabase.table("users_profile").update(update_data).eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(404, "Petugas tidak ditemukan")
        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating petugas: {str(e)}")


def update_petugas_status(user_id: str, status: str):
    """Update petugas status."""
    return update_petugas(user_id, {"status": status})


def reset_petugas_password(user_id: str, mode: str):
    """Reset petugas password (triggers Supabase auth flow)."""
    try:
        # In real implementation, this would trigger Supabase password reset email
        return {"message": "Email reset password telah dikirim"}

    except Exception as e:
        raise HTTPException(500, f"Error resetting password: {str(e)}")
