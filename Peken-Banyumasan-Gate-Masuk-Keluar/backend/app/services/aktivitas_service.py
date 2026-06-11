from app.db.supabase import supabase_admin
from fastapi import HTTPException


def list_aktivitas(q: str = None, limit: int = 50):
    """List all stories for admin moderation (cross-author feed).

    CARRYOVER fix: PostgREST cannot embed stories→kolaborators via the
    polymorphic (author_id + author_type) columns because there is no FK.
    Instead: fetch stories first, then resolve authors by author_type in
    separate queries, then merge in Python.
    """
    try:
        # Step 1: fetch stories (no embed)
        query = supabase_admin.table("stories").select("*")

        if q:
            query = query.or_(f"konten.ilike.%{q}%")

        res = query.order("created_at", desc=True).limit(limit).execute()
        rows = res.data or []

        if not rows:
            return []

        # Step 2: collect author_ids per author_type
        kolab_ids = list({r["author_id"] for r in rows if r.get("author_type") == "kolaborator" and r.get("author_id")})
        artisan_ids = list({r["author_id"] for r in rows if r.get("author_type") == "artisan" and r.get("author_id")})

        # Step 3: batch-fetch names
        kolab_map: dict = {}
        artisan_map: dict = {}

        if kolab_ids:
            k_res = supabase_admin.table("kolaborators") \
                .select("id, nama") \
                .in_("id", kolab_ids) \
                .execute()
            kolab_map = {k["id"]: k.get("nama", "—") for k in (k_res.data or [])}

        if artisan_ids:
            a_res = supabase_admin.table("artisans") \
                .select("id, nama_usaha") \
                .in_("id", artisan_ids) \
                .execute()
            artisan_map = {a["id"]: a.get("nama_usaha", "—") for a in (a_res.data or [])}

        # Step 4: merge author names into stories
        stories = []
        for row in rows:
            author_type = row.get("author_type", "")
            author_id = row.get("author_id", "")
            if author_type == "kolaborator":
                row["nama"] = kolab_map.get(author_id, "—")
                row["kolaborator_id"] = author_id
            elif author_type == "artisan":
                row["nama"] = artisan_map.get(author_id, "—")
                row["kolaborator_id"] = None
            else:
                row["nama"] = "—"
                row["kolaborator_id"] = None
            stories.append(row)

        return stories

    except Exception as e:
        raise HTTPException(500, f"Error listing aktivitas: {str(e)}")


def delete_aktivitas(aktivitas_id: str):
    """Soft-delete a story (sets status='dihapus') per OpenAPI spec."""
    try:
        res = supabase_admin.table("stories") \
            .update({"status": "dihapus"}) \
            .eq("id", aktivitas_id) \
            .execute()

        if not res.data:
            raise HTTPException(404, "Story tidak ditemukan")

        return {"message": "Story dihapus"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error deleting aktivitas: {str(e)}")
