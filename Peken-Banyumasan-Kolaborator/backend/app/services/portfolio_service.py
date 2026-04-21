from app.db.supabase import supabase


def get_portfolio(user_payload: dict) -> list[dict]:
    user_id = user_payload.get("user_id")
    if not user_id:
        return []

    result = supabase.table("portfolios").select("*").eq("user_id", user_id).execute()
    return result.data or []
