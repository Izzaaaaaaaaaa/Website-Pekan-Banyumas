"""
Portfolio service — Kolaborator karya CRUD.

Maps to the `karya` table with owner_type='kolaborator' scope.
"""

from app.db.supabase import supabase, supabase_admin


def get_portfolio(user_payload: dict) -> list[dict]:
    """GET /api/kolaborator/me/portofolio — list own karya items."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return []

    client = supabase_admin or supabase
    result = (
        client.table("karya")
        .select("*")
        .eq("owner_type", "kolaborator")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def create_portfolio(user_payload: dict, payload: dict) -> dict:
    """POST /api/kolaborator/me/portofolio — create a new karya item."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    insert_data = {
        "owner_type": "kolaborator",
        "owner_id": user_id,
        "judul": payload.get("judul"),
        "subsektor": payload.get("subsektor"),
        "deskripsi": payload.get("deskripsi", ""),
        "tahun": payload.get("tahun"),
        "featured": payload.get("featured", False),
        "gambar_url": payload.get("gambar_url"),
    }
    client = supabase_admin or supabase
    result = client.table("karya").insert(insert_data).execute()
    return result.data[0] if result.data else {}


def update_portfolio(user_payload: dict, portfolio_id: str, payload: dict) -> dict:
    """PATCH /api/kolaborator/me/portofolio/{id} — update own karya item."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    update_fields = {
        "judul": payload.get("judul"),
        "subsektor": payload.get("subsektor"),
        "deskripsi": payload.get("deskripsi"),
        "tahun": payload.get("tahun"),
        "featured": payload.get("featured"),
        "gambar_url": payload.get("gambar_url"),
    }
    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    client = supabase_admin or supabase
    if update_fields:
        client.table("karya").update(update_fields).eq("id", portfolio_id).eq("owner_type", "kolaborator").eq("owner_id", user_id).execute()

    result = (
        client.table("karya")
        .select("*")
        .eq("id", portfolio_id)
        .eq("owner_type", "kolaborator")
        .eq("owner_id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else {}


def delete_portfolio(user_payload: dict, portfolio_id: str) -> dict:
    """DELETE /api/kolaborator/me/portofolio/{id} — delete own karya item."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"message": "Unauthorized"}

    client = supabase_admin or supabase
    client.table("karya").delete().eq("id", portfolio_id).eq("owner_type", "kolaborator").eq("owner_id", user_id).execute()
    return {"message": "Item portofolio dihapus"}
