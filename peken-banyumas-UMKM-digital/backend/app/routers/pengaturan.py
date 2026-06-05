from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import ChangePasswordSchema
from app.schemas.pengaturan import UpdateProfilSchema, UpdateQrisSchema
from app.services import pengaturan_service, auth_service
from app.models.model import ProfilResponse, QrisResponse, MessageResponse
from app.middleware import get_current_user

router = APIRouter(prefix="/pengaturan", tags=["Pengaturan"])


@router.get("/profil", response_model=ProfilResponse)
def get_profil(user=Depends(get_current_user)):
    try:
        return pengaturan_service.get_profil(user["sub"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/profil", response_model=MessageResponse)
def update_profil(body: UpdateProfilSchema, user=Depends(get_current_user)):
    try:
        pengaturan_service.update_profil(user["sub"], body)
        return {"message": "Profil berhasil diperbarui"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/password", response_model=MessageResponse)
def change_password(body: ChangePasswordSchema, user=Depends(get_current_user)):
    try:
        return auth_service.change_password(user["sub"], body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/qris", response_model=QrisResponse)
def update_qris(body: UpdateQrisSchema, user=Depends(get_current_user)):
    """
    Update QRIS artisan.
    Return { qris_url, updated_at } sesuai OpenAPI artisan yaml 830–842.
    """
    return pengaturan_service.update_qris(user["sub"], body)


@router.delete("/qris", response_model=MessageResponse)
def hapus_qris(user=Depends(get_current_user)):
    return pengaturan_service.hapus_qris(user["sub"])
