from fastapi import APIRouter
from app.services.dashboard_service import get_dashboard_stats, get_recent_activity

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def stats():
    return get_dashboard_stats()

@router.get("/activities")
def activities():
    return get_recent_activity()