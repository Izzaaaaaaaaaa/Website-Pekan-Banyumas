from fastapi import APIRouter

from app.api.utils import _envelope
from app.db.supabase import supabase

router = APIRouter(prefix="/test", tags=["Test"])


@router.get("/db")
def test_db():
    """GET /test/db — quick DB connectivity check, reads from events table."""
    result = supabase.table("events").select("id, nama").limit(5).execute()
    return _envelope(result.data)
