from fastapi import APIRouter
from app.db import supabase_admin
from app.envelope import ok

router = APIRouter(prefix="/api/public", tags=["public-stats"])


@router.get("/stats")
def get_public_stats():
    # Semua query pakai service_role (bypass RLS) — hanya return aggregate, bukan raw rows

    edisi = supabase_admin.table("events").select("id", count="exact").in_(
        "status", ["berlangsung", "selesai"]
    ).execute()

    kolaborator = supabase_admin.table("kolaborators").select("id", count="exact").eq(
        "status", "aktif"
    ).execute()

    artisan = supabase_admin.table("artisans").select("id", count="exact").eq(
        "status", "aktif"
    ).execute()

    visitors = supabase_admin.table("visitors").select("id", count="exact").execute()

    return ok({
        "edisi_count": edisi.count or 0,
        "kolaborator_aktif": kolaborator.count or 0,
        "artisan_aktif": artisan.count or 0,
        "pengunjung_total": visitors.count or 0,
    })
