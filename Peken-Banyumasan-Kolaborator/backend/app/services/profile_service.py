from app.db.supabase import supabase


def get_profile(user_payload: dict) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    result = supabase.table("users").select("id, email, nama, role").eq("id", user_id).limit(1).execute()
    return result.data[0] if result.data else {}
