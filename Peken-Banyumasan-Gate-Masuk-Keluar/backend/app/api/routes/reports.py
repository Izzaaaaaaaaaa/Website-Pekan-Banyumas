from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from app.services.report_service import export_gate_logs_csv
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/export")
def export(
    event_id: str = Query(...),
    user=Depends(get_current_user)
):
    # 🔐 hanya admin boleh export
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh export laporan")

    csv_file = export_gate_logs_csv(event_id)

    # 🧠 filename dinamis
    filename = f"report_event_{event_id}.csv"

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )