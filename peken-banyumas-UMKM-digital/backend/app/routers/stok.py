from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.stok import TambahStokSchema, EditStokSchema
from app.services import stok_service
from app.models.model import StokItem, MessageResponse
from app.middleware import get_current_user
from typing import List

router = APIRouter(prefix="/stok", tags=["Manajemen Stok"])


@router.get("", response_model=List[StokItem])
def get_stok(user=Depends(get_current_user)):
    return stok_service.get_all_stok(user["sub"])


@router.get("/kritis", response_model=List[StokItem])
def get_stok_kritis(user=Depends(get_current_user)):
    return stok_service.get_stok_kritis(user["sub"])


@router.post("", response_model=StokItem, status_code=status.HTTP_201_CREATED)
def tambah_stok(body: TambahStokSchema, user=Depends(get_current_user)):
    try:
        return stok_service.tambah_stok(user["sub"], body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{stok_id}", response_model=StokItem)
def edit_stok(stok_id: str, body: EditStokSchema, user=Depends(get_current_user)):
    try:
        return stok_service.edit_stok(user["sub"], stok_id, body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{stok_id}", response_model=MessageResponse)
def hapus_stok(stok_id: str, user=Depends(get_current_user)):
    try:
        return stok_service.hapus_stok(user["sub"], stok_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
