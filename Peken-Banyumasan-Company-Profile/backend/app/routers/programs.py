from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.envelope import ok, err

router = APIRouter(prefix="/api/public", tags=["public-programs"])


@router.get("/programs")
def list_programs():
    res = (
        supabase.table("programs")
        .select("id, slug, nama, deskripsi, konten, icon, icon_url, urutan, aktif")
        .eq("aktif", True)
        .order("urutan")
        .execute()
    )
    return ok(res.data or [])


@router.get("/programs/{slug}")
def get_program(slug: str):
    res = (
        supabase.table("programs")
        .select("id, slug, nama, deskripsi, konten, icon, icon_url, urutan, aktif")
        .eq("slug", slug)
        .eq("aktif", True)
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail=err("Program tidak ditemukan"))

    return ok(res.data)
