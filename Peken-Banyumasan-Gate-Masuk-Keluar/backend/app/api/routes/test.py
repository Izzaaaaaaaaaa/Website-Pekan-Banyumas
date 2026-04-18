from fastapi import APIRouter
from app.db.supabase import supabase

router = APIRouter(prefix="/test", tags=["Test"])

@router.get("/db")
def test_db():
    res = supabase.table("users").select("*").limit(5).execute()
    return res.data