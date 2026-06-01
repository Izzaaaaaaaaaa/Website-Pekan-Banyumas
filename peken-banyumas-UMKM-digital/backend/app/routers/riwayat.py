from fastapi import APIRouter, Depends
from app.services import riwayat_service
from app.models.model import RiwayatItem
from app.middleware import get_current_user
from typing import List

router = APIRouter(prefix="/riwayat", tags=["Riwayat Transaksi"])


@router.get("/", response_model=List[RiwayatItem])
def get_riwayat(user=Depends(get_current_user)):
    return riwayat_service.get_all_riwayat(user["sub"])
