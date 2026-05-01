from app.db.supabase import supabase


def get_portfolio(user_payload: dict) -> list[dict]:
    user_id = user_payload.get("user_id")
    if not user_id:
        return []

    result = supabase.table("portfolios").select("*").eq("user_id", user_id).execute()
    return result.data or []


def create_portfolio(user_payload: dict, payload: dict) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    insert_data = {
        "user_id": user_id,
        "judul": payload.get("judul"),
        "subsektor": payload.get("subsektor"),
        "deskripsi": payload.get("deskripsi"),
        "tahun": payload.get("tahun"),
        "featured": payload.get("featured", False),
        "gambar_url": payload.get("gambar_url"),
    }
    result = supabase.table("portfolios").insert(insert_data).execute()
    return result.data[0] if result.data else {}


def update_portfolio(user_payload: dict, portfolio_id: str, payload: dict) -> dict:
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
    if update_fields:
        supabase.table("portfolios").update(update_fields).eq("id", portfolio_id).eq("user_id", user_id).execute()

    result = supabase.table("portfolios").select("*").eq("id", portfolio_id).eq("user_id", user_id).limit(1).execute()
    return result.data[0] if result.data else {}


def delete_portfolio(user_payload: dict, portfolio_id: str) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"message": "Unauthorized"}

    supabase.table("portfolios").delete().eq("id", portfolio_id).eq("user_id", user_id).execute()
    return {"message": "OK"}
