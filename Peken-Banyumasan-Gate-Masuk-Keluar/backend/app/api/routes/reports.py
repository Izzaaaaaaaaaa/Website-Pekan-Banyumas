from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.services.report_service import export_gate_logs_csv
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/export")
def export(
    event_id: str = Query(...),
    user=Depends(get_current_user)
):
    csv_file = export_gate_logs_csv(event_id)

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=report_gate_logs.csv"
        }
    )