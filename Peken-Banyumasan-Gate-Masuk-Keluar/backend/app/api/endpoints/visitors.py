from fastapi import APIRouter
from app.utils.response import success

router = APIRouter()

@router.get("/")
def get_visitors():
    return success([])

@router.post("/manual")
def manual():
    return success()