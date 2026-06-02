from app.db.supabase import supabase_admin
from fastapi import HTTPException


def list_aktivitas(q: str = None, limit: int = 50):
    """List all stories for admin moderation (cross-author feed).

    Queries the `stories` table and joins to `kolaborators` to embed
    author info (kolaborator_id, nama) per the OpenAPI spec.
    """
    try:
        query = supabase_admin.table("stories") \
            .select("*, kolaborators(id, nama)") \
            .eq("author_type", "kolaborator")

        if q:
            query = query.or_(f"konten.ilike.%{q}%")

        res = query.order("created_at", desc=True).limit(limit).execute()

        # Flatten: embed kolaborator_id and nama at top level
        stories = []
        for row in (res.data or []):
            kolab = row.pop("kolaborators", None) or {}
            row["kolaborator_id"] = kolab.get("id") or row.get("author_id")
            row["nama"] = kolab.get("nama", "—")
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
