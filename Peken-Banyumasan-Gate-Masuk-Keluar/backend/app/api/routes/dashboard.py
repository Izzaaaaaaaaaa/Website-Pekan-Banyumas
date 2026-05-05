from fastapi import APIRouter, Query, Depends, HTTPException
from typing import List, Optional

from app.services.dashboard_service import get_dashboard_stats, get_recent_activity
from app.api.deps import get_current_user
from app.schemas.dashboard_schema import DashboardStats, ActivityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# 🔥 STATS (event_id optional)
@router.get("/stats", response_model=DashboardStats)
def stats(
    event_id: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    try:
        return get_dashboard_stats(event_id)
    except Exception as e:
        print("ERROR ROUTE STATS:", e)
        raise HTTPException(500, "Gagal mengambil dashboard stats")


# 🔥 ACTIVITIES (event_id optional)
@router.get("/activities", response_model=List[ActivityItem])
def activities(
    event_id: Optional[str] = Query(None),
    limit: int = Query(10),
    user=Depends(get_current_user)
):
    if limit < 1:
        raise HTTPException(400, "limit minimal 1")

    try:
        return get_recent_activity(event_id, limit)
    except Exception as e:
        print("ERROR ROUTE ACTIVITIES:", e)
        raise HTTPException(500, "Gagal mengambil aktivitas")