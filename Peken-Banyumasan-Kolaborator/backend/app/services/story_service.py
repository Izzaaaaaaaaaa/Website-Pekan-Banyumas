from app.db.supabase import supabase


def get_stories(user_payload: dict | None = None) -> list[dict]:
    query = supabase.table("stories").select("*")
    if user_payload and user_payload.get("user_id"):
        query = query.eq("user_id", user_payload.get("user_id"))
    result = query.order("created_at", desc=True).execute()
    return result.data or []


def create_story(user_payload: dict, payload: dict) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    insert_data = {
        "user_id": user_id,
        "konten": payload.get("konten"),
        "media_url": payload.get("media_url"),
        "tags": payload.get("tags") or [],
        "like_count": payload.get("like_count", 0),
        "status": payload.get("status", "aktif"),
    }
    result = supabase.table("stories").insert(insert_data).execute()
    return result.data[0] if result.data else {}


def delete_story(user_payload: dict, story_id: str) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"message": "Unauthorized"}

    supabase.table("stories").delete().eq("id", story_id).eq("user_id", user_id).execute()
    return {"message": "OK"}
