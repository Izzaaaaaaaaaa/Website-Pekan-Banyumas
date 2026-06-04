from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.schemas.kas import TambahKasSchema, EditKasSchema
from app.services import kas_service
from app.models.model import KasItem, MessageResponse
from app.middleware import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/kas", tags=["Buku Kas"])


@router.get("", response_model=List[KasItem])
def get_kas(
    jenis: Optional[str] = Query(None, description="masuk | keluar"),
    user=Depends(get_current_user),
):
    return kas_service.get_all_kas(user["sub"], jenis)


@router.get("/summary")
def get_summary(user=Depends(get_current_user)):
    return kas_service.get_summary(user["sub"])


@router.post("", response_model=KasItem, status_code=status.HTTP_201_CREATED)
def tambah_kas(body: TambahKasSchema, user=Depends(get_current_user)):
    try:
        return kas_service.tambah_kas(user["sub"], body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{kas_id}", response_model=KasItem)
def edit_kas(kas_id: str, body: EditKasSchema, user=Depends(get_current_user)):
    try:
        return kas_service.edit_kas(user["sub"], kas_id, body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{kas_id}", response_model=MessageResponse)
def hapus_kas(kas_id: str, user=Depends(get_current_user)):
    try:
        return kas_service.hapus_kas(user["sub"], kas_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
