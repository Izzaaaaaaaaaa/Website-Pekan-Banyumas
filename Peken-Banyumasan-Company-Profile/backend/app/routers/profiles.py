from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.envelope import ok, err

router = APIRouter(prefix="/api/public", tags=["public-profiles"])

# Fields yang BOLEH dikembalikan ke public — NO email, no_hp, financials
KOLABORATOR_PUBLIC_FIELDS = (
    "id, slug, nama, kota, bio, foto_url, cover_url, subsektor, status"
)
ARTISAN_PUBLIC_FIELDS = (
    "id, slug, nama_usaha, kota, deskripsi, foto_url, cover_url, kategori_usaha, status"
)


@router.get("/profiles/{slug}")
def get_public_profile(slug: str):
    # Cari di kolaborators dulu
    res = (
        supabase.table("kolaborators")
        .select(KOLABORATOR_PUBLIC_FIELDS)
        .eq("slug", slug)
        .eq("status", "aktif")
        .single()
        .execute()
    )

    if res.data:
        profile = res.data
        profile["role"] = "kolaborator"
        profile["nama"] = profile.get("nama", "")
        profile["bio"] = profile.get("bio", "")
        profile["karya"] = _get_karya(profile["id"], "kolaborator")
        profile["story"] = _get_stories(profile["id"], "kolaborator")
        return ok(profile)

    # Cari di artisans
    res = (
        supabase.table("artisans")
        .select(ARTISAN_PUBLIC_FIELDS)
        .eq("slug", slug)
        .eq("status", "aktif")
        .single()
        .execute()
    )

    if res.data:
        profile = res.data
        profile["role"] = "artisan"
        # Normalize field names ke PublicProfile schema
        profile["nama"] = profile.pop("nama_usaha", "")
        profile["bio"] = profile.pop("deskripsi", "")
        profile["subsektor"] = profile.pop("kategori_usaha", [])
        profile["karya"] = _get_karya(profile["id"], "artisan")
        profile["story"] = _get_stories(profile["id"], "artisan")
        return ok(profile)

    raise HTTPException(status_code=404, detail=err("Profil tidak ditemukan"))


def _get_karya(owner_id: str, owner_type: str) -> list:
    res = (
        supabase.table("karya")
        .select("id, judul, subsektor, deskripsi, tahun, gambar_url, featured, owner_type, owner_id, created_at, updated_at")
        .eq("owner_id", owner_id)
        .eq("owner_type", owner_type)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


def _get_stories(author_id: str, author_type: str) -> list:
    res = (
        supabase.table("stories")
        .select("id, konten, media_url, tags, like_count, status, created_at")
        .eq("author_id", author_id)
        .eq("author_type", author_type)
        .eq("status", "aktif")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []
