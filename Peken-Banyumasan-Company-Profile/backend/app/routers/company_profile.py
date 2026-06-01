from fastapi import APIRouter, Query, HTTPException
from app.db import supabase
from app.envelope import ok, err

router = APIRouter(prefix="/api/public", tags=["public-company"])

VALID_SECTIONS = {"home", "about", "tim", "programs", "works", "gallery"}


@router.get("/company-profile")
def get_company_profile_section(section: str = Query(...)):
    if section not in VALID_SECTIONS:
        raise HTTPException(
            status_code=400,
            detail=err(f"Parameter 'section' tidak valid. Pilihan: {', '.join(VALID_SECTIONS)}")
        )

    res = (
        supabase.table("company_profile_sections")
        .select("content")
        .eq("section", section)
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail=err("Section tidak ditemukan"))

    return ok(res.data["content"])
