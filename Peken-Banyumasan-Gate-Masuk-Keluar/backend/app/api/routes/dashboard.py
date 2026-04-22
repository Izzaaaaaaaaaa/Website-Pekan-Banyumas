from fastapi import APIRouter, Query, Depends
from app.services.dashboard_service import *
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def stats(
    event_id: str = Query(...),
    user=Depends(get_current_user)
):
    return get_dashboard_stats(event_id)


@router.get("/activities")
def activities(
    event_id: str = Query(...),
    limit: int = Query(10),
    user=Depends(get_current_user)
):
    return get_recent_activity(event_id, limit)