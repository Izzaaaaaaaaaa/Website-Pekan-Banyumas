from fastapi import APIRouter, Query, HTTPException
from app.db import supabase
from app.envelope import ok, err

router = APIRouter(prefix="/api/public", tags=["public-karya"])


@router.get("/karya")
def list_karya(
    subsektor: str | None = Query(default=None),
    featured: bool | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    kolaborator_id: str | None = Query(default=None),
    artisan_id: str | None = Query(default=None),
):
    # Mutually exclusive filter
    if kolaborator_id and artisan_id:
        raise HTTPException(
            status_code=400,
            detail=err("Parameter 'kolaborator_id' dan 'artisan_id' tidak bisa digunakan bersamaan")
        )

    query = supabase.table("karya").select(
        "id, judul, subsektor, deskripsi, tahun, gambar_url, featured, "
        "owner_type, owner_id, created_at, updated_at"
    )

    if subsektor:
        query = query.eq("subsektor", subsektor)
    if featured is not None:
        query = query.eq("featured", featured)
    if kolaborator_id:
        query = query.eq("owner_type", "kolaborator").eq("owner_id", kolaborator_id)
    if artisan_id:
        query = query.eq("owner_type", "artisan").eq("owner_id", artisan_id)

    res = query.limit(limit).order("created_at", desc=True).execute()
    items = res.data or []

    # Join owner name + slug
    items = _attach_owner_info(items)

    return ok(items)


def _attach_owner_info(items: list) -> list:
    """Attach owner name and slug by batching lookups per owner_type."""
    if not items:
        return items

    kol_ids = [i["owner_id"] for i in items if i["owner_type"] == "kolaborator"]
    art_ids = [i["owner_id"] for i in items if i["owner_type"] == "artisan"]

    kol_map = {}
    art_map = {}

    if kol_ids:
        res = (
            supabase.table("kolaborators")
            .select("id, nama, slug")
            .in_("id", kol_ids)
            .execute()
        )
        kol_map = {r["id"]: r for r in (res.data or [])}

    if art_ids:
        res = (
            supabase.table("artisans")
            .select("id, nama_usaha, slug")
            .in_("id", art_ids)
            .execute()
        )
        art_map = {r["id"]: r for r in (res.data or [])}

    for item in items:
        if item["owner_type"] == "kolaborator":
            owner = kol_map.get(item["owner_id"], {})
            item["owner"] = owner.get("nama", "")
            item["owner_slug"] = owner.get("slug", "")
        else:
            owner = art_map.get(item["owner_id"], {})
            item["owner"] = owner.get("nama_usaha", "")
            item["owner_slug"] = owner.get("slug", "")

    return items
