"""
Auth service — Kolaborator registration via Supabase Admin SDK.

Login/logout/me/changePassword are handled Supabase-direct on the frontend.
Only register (atomically create auth user + users_profile + kolaborators row)
and custom profile update live here.
"""

from app.db.supabase import supabase_admin, supabase


def register_kolaborator(payload: dict) -> dict:
    """Register a new kolaborator.

    Atomically:
    1. Create Supabase Auth user via Admin SDK (app_metadata.role='kolaborator',
       app_metadata.status='pending')
    2. Insert a `users_profile` row
    3. Insert a `kolaborators` row

    Returns envelope-ready data on success, or dict with 'error' key on failure.
    """
    if not supabase_admin:
        return {"error": "Server belum dikonfigurasi (service role key tidak tersedia)", "status_code": 500}

    email = payload.get("email")
    password = payload.get("password")
    nama = payload.get("nama", "")
    role = payload.get("role", "kolaborator")
    kota = payload.get("kota", "")
    subsektor = payload.get("subsektor", [])
    bio = payload.get("bio", "")

    # Validate role — only 'kolaborator' allowed from this endpoint
    if role != "kolaborator":
        return {"error": "Role harus 'kolaborator'", "status_code": 422}

    if not email:
        return {"error": "Email wajib diisi", "status_code": 422}
    if not password or len(password) < 8:
        return {"error": "Password minimal 8 karakter", "status_code": 422}
    if not nama or len(nama) < 2:
        return {"error": "Nama minimal 2 karakter", "status_code": 422}
    if not subsektor:
        return {"error": "Minimal 1 subsektor dipilih", "status_code": 422}

    # Step 1: Create Supabase Auth user via Admin SDK
    try:
        auth_response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # skip email verification for now
            "app_metadata": {
                "role": "kolaborator",
                "status": "pending",
            },
            "user_metadata": {
                "nama": nama,
            },
        })
    except Exception as e:
        error_msg = str(e)
        if "already" in error_msg.lower() or "duplicate" in error_msg.lower():
            return {"error": "Email sudah terdaftar", "status_code": 409}
        return {"error": f"Gagal membuat akun: {error_msg}", "status_code": 500}

    user = auth_response.user
    if not user:
        return {"error": "Gagal membuat akun", "status_code": 500}

    user_id = user.id

    # Step 2: Insert users_profile row
    try:
        supabase_admin.table("users_profile").insert({
            "id": user_id,
            "nama": nama,
            "role": "kolaborator",
        }).execute()
    except Exception as e:
        # Rollback: delete the auth user
        try:
            supabase_admin.auth.admin.delete_user(user_id)
        except Exception:
            pass
        return {"error": f"Gagal membuat profil: {str(e)}", "status_code": 500}

    # Step 3: Insert kolaborators row
    try:
        supabase_admin.table("kolaborators").insert({
            "id": user_id,
            "email": email,
            "nama": nama,
            "kota": kota,
            "bio": bio or "",   # column is NOT NULL — never insert null when bio omitted
            "subsektor": subsektor,
            "status": "pending",
        }).execute()
    except Exception as e:
        # Rollback: delete users_profile and auth user
        try:
            supabase_admin.table("users_profile").delete().eq("id", user_id).execute()
        except Exception:
            pass
        try:
            supabase_admin.auth.admin.delete_user(user_id)
        except Exception:
            pass
        return {"error": f"Gagal membuat data kolaborator: {str(e)}", "status_code": 500}

    return {
        "message": "Registrasi berhasil, menunggu moderasi admin",
        "status": "pending",
    }


def update_auth_profile(user_id: str, payload: dict) -> dict:
    """Update custom profile fields in the `kolaborators` table.

    Only custom fields are accepted here (subsektor, kota, bio, foto_url,
    cover_url). nama/email updates go to Supabase Auth directly on the frontend.

    Returns the updated profile data or dict with 'error' key.
    """
    if not user_id:
        return {"error": "Unauthorized", "status_code": 401}

    # Build update dict from allowed fields only
    allowed = {"subsektor", "kota", "bio", "foto_url", "cover_url"}
    update_fields = {k: v for k, v in payload.items() if k in allowed and v is not None}

    if not update_fields:
        return {"error": "Tidak ada field yang diupdate", "status_code": 422}

    try:
        result = (
            supabase_admin or supabase
        ).table("kolaborators").update(update_fields).eq("id", user_id).execute()

        if result.data:
            record = result.data[0]
            return _sanitize_kolaborator(record)
        return {"error": "Kolaborator tidak ditemukan", "status_code": 404}
    except Exception as e:
        return {"error": f"Gagal update profil: {str(e)}", "status_code": 500}


def _sanitize_kolaborator(record: dict) -> dict:
    """Remove admin-only fields (no_hp, internal_notes) from kolaborator record."""
    sanitized = {k: v for k, v in record.items() if k not in ("no_hp", "internal_notes")}
    return sanitized
