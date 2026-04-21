from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.event_service import *
from app.api.deps import get_current_user

router = APIRouter(prefix="/events", tags=["Events"])

# SCHEMA
class EventCreate(BaseModel):
    nama: str
    deskripsi: str | None = None
    lokasi: str | None = None
    tanggal_mulai: str | None = None
    tanggal_selesai: str | None = None
    jam_mulai: str | None = None
    jam_selesai: str | None = None
    kapasitas: int | None = None
    status: str | None = "draft"


class EventUpdate(BaseModel):
    nama: str | None = None
    deskripsi: str | None = None
    lokasi: str | None = None
    tanggal_mulai: str | None = None
    tanggal_selesai: str | None = None
    jam_mulai: str | None = None
    jam_selesai: str | None = None
    kapasitas: int | None = None
    status: str | None = None


# GET ALL
@router.get("/")
def get_all(user=Depends(get_current_user)):
    return get_events()


# GET BY ID
@router.get("/{id}")
def get_one(id: str, user=Depends(get_current_user)):
    return get_event_by_id(id)


# CREATE
@router.post("/")
def create(data: EventCreate, user=Depends(get_current_user)):
    return create_event(data.dict())


# UPDATE
@router.put("/{id}")
def update(id: str, data: EventUpdate, user=Depends(get_current_user)):
    clean_data = {k: v for k, v in data.dict().items() if v is not None}

    if not clean_data:
        return {"error": "Tidak ada data yang diupdate"}

    return update_event(id, clean_data)

# DELETE
@router.delete("/{id}")
def delete(id: str, user=Depends(get_current_user)):
    return delete_event(id)