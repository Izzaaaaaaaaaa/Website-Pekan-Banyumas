"""
Story service — Kolaborator story CRUD.

Maps to the `stories` table with author_type='kolaborator' scope.
Delete is soft-delete (sets status='dihapus' per OpenAPI spec).
"""

from app.db.supabase import supabase, supabase_admin


def get_stories(user_payload: dict | None = None) -> list[dict]:
    """GET /api/kolaborator/me/story — list own stories (aktif only)."""
    client = supabase_admin or supabase
    query = client.table("stories").select("*")

    if user_payload and user_payload.get("user_id"):
        user_id = user_payload["user_id"]
        query = (
            query.eq("author_type", "kolaborator")
            .eq("author_id", user_id)
            .eq("status", "aktif")
        )

    result = query.order("created_at", desc=True).execute()
    return result.data or []


def create_story(user_payload: dict, payload: dict) -> dict:
    """POST /api/kolaborator/me/story — publish a new story."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    insert_data = {
        "author_type": "kolaborator",
        "author_id": user_id,
        "konten": payload.get("konten"),
        "media_url": payload.get("media_url"),
        "tags": payload.get("tags") or [],
        "status": "aktif",
    }
    client = supabase_admin or supabase
    result = client.table("stories").insert(insert_data).execute()
    return result.data[0] if result.data else {}


def delete_story(user_payload: dict, story_id: str) -> dict:
    """DELETE /api/kolaborator/me/story/{id} — soft-delete (status='dihapus')."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"message": "Unauthorized"}

    client = supabase_admin or supabase
    # Soft-delete: set status to 'dihapus' instead of hard delete
    client.table("stories").update({"status": "dihapus"}).eq("id", story_id).eq("author_type", "kolaborator").eq("author_id", user_id).execute()
    return {"message": "Story dihapus"}
