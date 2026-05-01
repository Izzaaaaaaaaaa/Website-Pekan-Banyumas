from app.db.supabase import supabase


def get_profile(user_payload: dict) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    result = (
        supabase.table("users")
        .select("id, email, nama, role, is_verified, created_at")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {}

    user = result.data[0]
    return {
        **user,
        "status": "aktif" if user.get("is_verified") else "pending",
        "kota": user.get("kota") or "",
        "bio": user.get("bio") or "",
        "subsektor": user.get("subsektor") or [],
        "foto_url": user.get("foto_url") or "",
        "cover_url": user.get("cover_url") or "",
        "tanggal_daftar": user.get("created_at"),
        "total_karya": user.get("total_karya") or 0,
        "total_story": user.get("total_story") or 0,
        "total_event": user.get("total_event") or 0,
    }


def update_profile(user_payload: dict, payload: dict) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    update_fields = {
        "nama": payload.get("nama"),
        "email": payload.get("email"),
    }
    update_fields = {k: v for k, v in update_fields.items() if v is not None}
    if update_fields:
        supabase.table("users").update(update_fields).eq("id", user_id).execute()

    return get_profile(user_payload)
