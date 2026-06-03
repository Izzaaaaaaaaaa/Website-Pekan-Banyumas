from app.db.supabase import supabase, supabase_admin


def get_dashboard_stats(user_payload: dict | None = None) -> dict:
    client = supabase_admin or supabase

    # --- Global stats ---
    events_total = (
        client.table("events")
        .select("id", count="exact")
        .in_("status", ["published", "berlangsung", "selesai"])
        .execute()
        .count or 0
    )
    stories_total = (
        client.table("stories")
        .select("id", count="exact")
        .eq("status", "aktif")
        .execute()
        .count or 0
    )

    # --- Personal stats ---
    user_id = user_payload.get("user_id") if user_payload else None
    my_karya = None
    my_story = None
    my_requests = None

    if user_id:
        try:
            my_karya = (
                client.table("karya")
                .select("id", count="exact")
                .eq("owner_type", "kolaborator")
                .eq("owner_id", user_id)
                .execute()
                .count or 0
            )
        except Exception:
            my_karya = 0

        try:
            my_story = (
                client.table("stories")
                .select("id", count="exact")
                .eq("author_type", "kolaborator")
                .eq("author_id", user_id)
                .eq("status", "aktif")
                .execute()
                .count or 0
            )
        except Exception:
            my_story = 0

        try:
            my_requests = (
                client.table("kolaborator_requests")
                .select("id", count="exact")
                .eq("kolaborator_id", user_id)
                .execute()
                .count or 0
            )
        except Exception:
            my_requests = 0

    return {
        "events_total": events_total,
        "stories_total": stories_total,
        "my_karya": my_karya,
        "my_story": my_story,
        "my_requests": my_requests,
    }
