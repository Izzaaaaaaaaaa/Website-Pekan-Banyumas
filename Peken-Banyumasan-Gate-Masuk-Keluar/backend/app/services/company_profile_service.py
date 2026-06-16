from app.db.supabase import supabase_admin
from fastapi import HTTPException


def get_company_profile(section: str):
    """Get company profile section content."""
    try:
        res = supabase_admin.table("company_profile_sections").select("content").eq("section", section).execute()
        if not res.data:
            return None
        return res.data[0].get("content")

    except Exception as e:
        raise HTTPException(500, f"Error fetching company profile: {str(e)}")


def save_company_profile(section: str, content: dict | list):
    """Save company profile section content."""
    try:
        # Upsert the content
        res = supabase_admin.table("company_profile_sections").upsert({
            "section": section,
            "content": content
        }).execute()

        return {"message": "Company profile berhasil disimpan"}

    except Exception as e:
        raise HTTPException(500, f"Error saving company profile: {str(e)}")


# ── KARYA (real kolaborator/artisan uploads — Publication catalog) ─────────────
# The public CP "Publication" page merges these live karya with the manual
# `works` section. The admin "Kelola Company Profile → Publication" tab needs to
# SEE every real upload (it only used to read the manual `works` section) and to
# toggle each upload's visibility via the `karya.tampil` flag. Owner display
# name + slug are JOINed here (same polymorphic owner resolution the CP backend
# does); orphan karya whose owner was deleted are skipped — they don't appear
# publicly either.
def list_all_karya():
    """List every karya (visible AND hidden), enriched with owner info, for admin."""
    try:
        res = supabase_admin.table("karya").select("*").order("created_at", desc=True).execute()
        rows = res.data or []
        if not rows:
            return []

        kolab_ids = list({r["owner_id"] for r in rows if r.get("owner_type") == "kolaborator" and r.get("owner_id")})
        art_ids = list({r["owner_id"] for r in rows if r.get("owner_type") == "artisan" and r.get("owner_id")})

        kolab_map = {}
        if kolab_ids:
            kr = supabase_admin.table("kolaborators").select("id,nama,slug").in_("id", kolab_ids).execute()
            kolab_map = {k["id"]: (k.get("nama"), k.get("slug")) for k in (kr.data or [])}

        art_map = {}
        if art_ids:
            ar = supabase_admin.table("artisans").select("id,nama_usaha,slug").in_("id", art_ids).execute()
            art_map = {a["id"]: (a.get("nama_usaha"), a.get("slug")) for a in (ar.data or [])}

        out = []
        for r in rows:
            if r.get("owner_type") == "kolaborator":
                nama, slug = kolab_map.get(r.get("owner_id"), (None, None))
            else:
                nama, slug = art_map.get(r.get("owner_id"), (None, None))
            if not nama:
                # Owner missing/deleted — skip (matches the public CP behaviour).
                continue
            out.append({
                "id":               r["id"],
                "judul":            r.get("judul", ""),
                "gambar_url":       r.get("gambar_url"),
                "owner":            nama,
                "owner_type":       r.get("owner_type"),
                "owner_id":         slug or "",  # CP lightbox links by slug
                "kategori_display": r.get("subsektor", ""),
                "tahun":            r.get("tahun"),
                "deskripsi":        r.get("deskripsi", ""),
                "visible":          r.get("tampil", True),
            })
        return out

    except Exception as e:
        raise HTTPException(500, f"Error fetching karya: {str(e)}")


def set_karya_visibility(karya_id: str, tampil: bool):
    """Toggle a single karya's public visibility (karya.tampil)."""
    try:
        res = supabase_admin.table("karya").update({"tampil": tampil}).eq("id", karya_id).execute()
        if not res.data:
            raise HTTPException(404, "Karya tidak ditemukan")
        return {"id": karya_id, "tampil": tampil}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating karya visibility: {str(e)}")
