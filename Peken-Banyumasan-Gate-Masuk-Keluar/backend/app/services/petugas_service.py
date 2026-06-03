import os
import random
import string
from app.db.supabase import supabase_admin
from fastapi import HTTPException


def list_petugas(status: str = None):
    """List all petugas accounts."""
    try:
        query = supabase_admin.table("users_profile").select("*").eq("role", "petugas")

        if status:
            query = query.eq("status", status)

        res = query.order("created_at", desc=True).execute()
        petugas_list = res.data or []
        
        if petugas_list:
            try:
                auth_users_res = supabase_admin.auth.admin.list_users()
                auth_users = auth_users_res if isinstance(auth_users_res, list) else getattr(auth_users_res, 'users', [])
                last_sign_in_map = {str(u.id): getattr(u, 'last_sign_in_at', None) for u in auth_users}
                
                for p in petugas_list:
                    p["last_sign_in_at"] = str(last_sign_in_map.get(str(p.get("id")))) if last_sign_in_map.get(str(p.get("id"))) else None
            except Exception:
                pass

        return petugas_list

    except Exception as e:
        raise HTTPException(500, f"Error listing petugas: {str(e)}")


def get_petugas(user_id: str):
    """Get petugas details."""
    try:
        res = supabase_admin.table("users_profile").select("*").eq("id", user_id).eq("role", "petugas").single().execute()
        if not res.data:
            raise HTTPException(404, "Petugas tidak ditemukan")
            
        petugas = res.data
        try:
            auth_user = supabase_admin.auth.admin.get_user_by_id(user_id)
            user_obj = getattr(auth_user, 'user', auth_user)
            petugas["last_sign_in_at"] = str(getattr(user_obj, 'last_sign_in_at', None)) if getattr(user_obj, 'last_sign_in_at', None) else None
        except Exception:
            petugas["last_sign_in_at"] = None
            
        return petugas

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching petugas: {str(e)}")


def create_petugas(email: str, nama: str, password: str, jabatan: str = None):
    """Create a new petugas account (Auth + Profile)."""
    try:
        # Check if email already exists
        existing = supabase_admin.table("users_profile").select("*").eq("email", email).execute()
        if existing.data:
            raise HTTPException(409, "Email sudah terdaftar")

        # Create user in Supabase Auth via Admin SDK
        auth_res = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "nama": nama,
                "role": "petugas"
            }
        })
        
        user = auth_res.user

        # Create profile record
        try:
            res = supabase_admin.table("users_profile").insert({
                "id": user.id,
                "email": email,
                "nama": nama,
                "role": "petugas",
                "jabatan": jabatan,
                "status": "aktif"
            }).execute()

            if not res.data:
                raise Exception("Gagal insert profile")
            
            return res.data[0]
        except Exception as e:
            # Rollback auth creation if profile fails
            supabase_admin.auth.admin.delete_user(user.id)
            raise HTTPException(500, f"Gagal membuat akun petugas: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creating petugas: {str(e)}")


def update_petugas(user_id: str, data: dict):
    """Update petugas profile and Auth email if changed."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return get_petugas(user_id)
            
        # If email is updated, update Supabase Auth first
        if "email" in update_data:
            try:
                supabase_admin.auth.admin.update_user_by_id(
                    user_id,
                    {"email": update_data["email"], "email_confirm": True}
                )
            except Exception as e:
                raise HTTPException(400, f"Gagal update email Auth: {str(e)}")

        res = supabase_admin.table("users_profile").update(update_data).eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(404, "Petugas tidak ditemukan")
        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating petugas: {str(e)}")


def update_petugas_status(user_id: str, status: str):
    """Update petugas status (Profile + Auth ban)."""
    try:
        # Update Auth (disable = ban)
        try:
            if status == "disabled":
                ban_date = "2099-12-31T23:59:59Z"
                supabase_admin.auth.admin.update_user_by_id(user_id, {"ban_duration": "876000h"}) # approx 100 years
            else:
                supabase_admin.auth.admin.update_user_by_id(user_id, {"ban_duration": "none"})
        except Exception as auth_e:
            print(f"Warning: Failed to update auth status for {user_id}: {auth_e}")
            
        return update_petugas(user_id, {"status": status})
    except Exception as e:
        raise HTTPException(500, f"Error updating petugas status: {str(e)}")


def delete_petugas(user_id: str):
    """Delete petugas."""
    try:
        try:
            supabase_admin.auth.admin.delete_user(user_id)
        except Exception as auth_e:
            print(f"Warning: Failed to delete auth user {user_id}: {auth_e}")
            
        supabase_admin.table("users_profile").delete().eq("id", user_id).execute()
        return {"message": "Petugas berhasil dihapus"}
    except Exception as e:
        raise HTTPException(500, f"Error deleting petugas: {str(e)}")


def reset_petugas_password(user_id: str, mode: str):
    """Reset petugas password via email or temp password."""
    try:
        # Get user email
        user_res = supabase_admin.table("users_profile").select("email").eq("id", user_id).single().execute()
        if not user_res.data:
            raise HTTPException(404, "Petugas tidak ditemukan")
            
        email = user_res.data["email"]

        if mode == "email_link":
            # Send reset email
            supabase_admin.auth.reset_password_for_email(
                email, 
                {"redirect_to": "http://localhost:5174/pengaturan-akun"}
            )
            return {"message": "Link reset password telah dikirim ke email petugas."}
            
        elif mode == "temp_password":
            # Generate secure random password
            chars = string.ascii_letters + string.digits + "!@#$%^&*"
            temp_password = "".join(random.choice(chars) for _ in range(10))
            
            # Update password directly
            supabase_admin.auth.admin.update_user_by_id(user_id, {"password": temp_password})
            
            return {"temp_password": temp_password}
        else:
            raise HTTPException(400, "Mode tidak valid")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error resetting password: {str(e)}")
