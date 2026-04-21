from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.member_service import *
from app.api.deps import get_current_user

router = APIRouter(prefix="/members", tags=["Members"])

# REQUEST SCHEMA
class MemberCreate(BaseModel):
    nama: str
    email: str
    card_uid: str | None = None


class MemberUpdate(BaseModel):
    nama: str | None = None
    email: str | None = None


# GET ALL
@router.get("/")
def get_all(user=Depends(get_current_user)):
    return get_members()


# GET BY ID
@router.get("/{id}")
def get_one(id: str, user=Depends(get_current_user)):
    return get_member_by_id(id)


# CREATE
@router.post("/")
def create(data: MemberCreate, user=Depends(get_current_user)):
    return create_member(data.dict())


# UPDATE
@router.put("/{id}")
def update(id: str, data: MemberUpdate, user=Depends(get_current_user)):
    return update_member(id, data.dict(exclude_none=True))


# DELETE
@router.delete("/{id}")
def delete(id: str, user=Depends(get_current_user)):
    return delete_member(id)