from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.supabase import supabase

router = APIRouter(prefix="/test", tags=["Test"])


@router.get("/db")
def test_db():
    """Quick DB connectivity check — reads from events table."""
    result = supabase.table("events").select("id, nama").limit(5).execute()
    return JSONResponse(
        content={"status": "success", "message": None, "data": result.data},
    )
