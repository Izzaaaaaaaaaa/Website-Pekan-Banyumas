"""
Profile service — Kolaborator self-profile read/update.

Reads from `kolaborators` table. Admin-only fields (no_hp, internal_notes)
are stripped from all responses per OpenAPI spec + SCHEMA_MAP R9 rule.
"""

from app.db.supabase import supabase, supabase_admin

# Columns safe to return to the kolaborator portal.
# no_hp and internal_notes are intentionally excluded (admin-only).
_KOLABORATOR_SELECT = (
    "id, slug, email, nama, kota, bio, foto_url, cover_url, "
    "subsektor, status, tanggal_daftar, total_karya, total_story, total_event"
)


def get_profile(user_payload: dict) -> dict:
    """GET /api/kolaborator/me — return own kolaborator record."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    client = supabase_admin or supabase
    result = (
        client.table("kolaborators")
        .select(_KOLABORATOR_SELECT)
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {}

    return result.data[0]


def update_profile(user_payload: dict, payload: dict) -> dict:
    """PATCH /api/kolaborator/me — update own kolaborator record.

    Allowed fields: nama, email, kota, bio, foto_url, cover_url, subsektor.
    Forbidden fields (silently dropped): status, total_*, tanggal_daftar.
    """
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    allowed = {"nama", "email", "kota", "bio", "foto_url", "cover_url", "subsektor"}
    update_fields = {k: v for k, v in payload.items() if k in allowed and v is not None}

    if not update_fields:
        return get_profile(user_payload)

    client = supabase_admin or supabase

    # If nama is updated, also sync to users_profile table
    if "nama" in update_fields:
        try:
            client.table("users_profile").update({"nama": update_fields["nama"]}).eq("id", user_id).execute()
        except Exception:
            pass

    # Update kolaborators table
    client.table("kolaborators").update(update_fields).eq("id", user_id).execute()

    return get_profile(user_payload)
