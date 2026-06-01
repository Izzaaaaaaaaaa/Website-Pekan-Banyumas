from fastapi import APIRouter, Query, HTTPException
from datetime import date
from app.db import supabase
from app.envelope import ok, err

router = APIRouter(prefix="/api/public", tags=["public-events"])

PUBLIC_EVENT_FIELDS = (
    "id, nama, tanggal, tanggal_selesai, jam_mulai, jam_selesai, "
    "lokasi, status, kapasitas, deskripsi, konten_lengkap, subsektor, banner_url, galeri"
)
PUBLIC_STATUSES = ["published", "berlangsung", "selesai"]


@router.get("/events")
def list_events(
    status: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    from_date: str | None = Query(default=None, alias="from"),
    to_date: str | None = Query(default=None, alias="to"),
):
    query = (
        supabase.table("events")
        .select(PUBLIC_EVENT_FIELDS)
        .in_("status", [status] if status else PUBLIC_STATUSES)
        .order("tanggal", desc=True)
        .limit(limit)
    )

    if from_date:
        query = query.gte("tanggal", from_date)
    if to_date:
        query = query.lte("tanggal", to_date)

    res = query.execute()
    return ok(res.data or [])


@router.get("/events/upcoming")
def list_upcoming_events(limit: int = Query(default=5, ge=1, le=20)):
    today = date.today().isoformat()
    res = (
        supabase.table("events")
        .select(PUBLIC_EVENT_FIELDS)
        .in_("status", ["published", "berlangsung"])
        .gte("tanggal_selesai", today)
        .order("tanggal")
        .limit(limit)
        .execute()
    )
    return ok(res.data or [])
