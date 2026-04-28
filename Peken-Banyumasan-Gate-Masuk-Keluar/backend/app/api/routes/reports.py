from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user

# 🔥 import service
from app.services.report_service import (
    export_gate_logs_csv,
    get_reports
)

router = APIRouter(prefix="/reports", tags=["Reports"])


# 🔥 LIST REPORTS (WAJIB)
@router.get("/")
def list_reports(
    event_id: str = Query(None),
    tanggal: str = Query(None),
    user=Depends(get_current_user)
):
    return get_reports(event_id, tanggal)


# 🔥 EXPORT CSV
@router.get("/export")
def export(
    event_id: str = Query(...),
    user=Depends(get_current_user)
):
    # 🔐 hanya admin boleh export
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh export laporan")

    csv_file = export_gate_logs_csv(event_id)

    filename = f"report_event_{event_id}.csv"

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )