from fastapi import APIRouter
from app.utils.response import success

router = APIRouter()

@router.get("/")
def get_events():
    return success([])

@router.post("/")
def create_event():
    return success({"id": 1})