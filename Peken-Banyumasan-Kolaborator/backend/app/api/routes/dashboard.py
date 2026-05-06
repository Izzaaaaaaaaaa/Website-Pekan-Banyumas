from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.deps import get_current_user
from app.services.dashboard_service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def stats(user: dict = Depends(get_current_user)):
    return JSONResponse(
        content={"status": "success", "message": None, "data": get_dashboard_stats(user)},
    )
