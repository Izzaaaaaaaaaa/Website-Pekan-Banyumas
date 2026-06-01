from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.promo import TambahPromoSchema, EditPromoSchema
from app.services import promo_service
from app.models.model import PromoItem, MessageResponse
from app.middleware import get_current_user
from typing import List

router = APIRouter(prefix="/promo", tags=["Promo & Diskon"])


@router.get("/", response_model=List[PromoItem])
def get_promo(user=Depends(get_current_user)):
    return promo_service.get_all_promo(user["sub"])


@router.post("/", response_model=PromoItem, status_code=status.HTTP_201_CREATED)
def tambah_promo(body: TambahPromoSchema, user=Depends(get_current_user)):
    try:
        return promo_service.tambah_promo(user["sub"], body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{promo_id}", response_model=PromoItem)
def edit_promo(promo_id: str, body: EditPromoSchema, user=Depends(get_current_user)):
    try:
        return promo_service.edit_promo(user["sub"], promo_id, body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{promo_id}", response_model=MessageResponse)
def hapus_promo(promo_id: str, user=Depends(get_current_user)):
    try:
        return promo_service.hapus_promo(user["sub"], promo_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
