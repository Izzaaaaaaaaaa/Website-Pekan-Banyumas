from fastapi import APIRouter, Depends
from app.services.member_service import *
from app.api.deps import get_current_user
from app.schemas.member_schema import MemberCreate, MemberUpdate  # 🔥 import schema

router = APIRouter(prefix="/members", tags=["Members"])


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