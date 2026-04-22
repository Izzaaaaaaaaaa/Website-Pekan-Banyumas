from fastapi import APIRouter, Query, Depends, HTTPException
from typing import List
from app.services.dashboard_service import *
from app.api.deps import get_current_user
from app.schemas.dashboard_schema import DashboardStats, ActivityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def stats(
    event_id: str = Query(...),
    user=Depends(get_current_user)
):
    return get_dashboard_stats(event_id)


@router.get("/activities", response_model=List[ActivityItem])
def activities(
    event_id: str = Query(...),
    limit: int = Query(10),
    user=Depends(get_current_user)
):
    if limit <= 0:
        raise HTTPException(400, "limit harus lebih dari 0")

    return get_recent_activity(event_id, limit)