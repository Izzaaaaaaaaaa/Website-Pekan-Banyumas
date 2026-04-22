from fastapi import APIRouter, Depends, HTTPException
from app.services.event_service import *
from app.api.deps import get_current_user
from app.schemas.event_schema import EventCreate, EventUpdate  # 🔥 import schema

router = APIRouter(prefix="/events", tags=["Events"])


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
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh membuat event")

    return create_event(data.dict())


# UPDATE
@router.put("/{id}")
def update(id: str, data: EventUpdate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh update event")

    clean_data = data.dict(exclude_none=True)

    if not clean_data:
        raise HTTPException(400, "Tidak ada data yang diupdate")

    return update_event(id, clean_data)


# DELETE
@router.delete("/{id}")
def delete(id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh hapus event")

    return delete_event(id)