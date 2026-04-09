from fastapi import APIRouter
from app.utils.response import success

router = APIRouter()

@router.get("/stats")
def stats():
    return success({
        "di_dalam": 0,
        "total_masuk": 0,
        "total_keluar": 0,
        "total_harian": 0
    })