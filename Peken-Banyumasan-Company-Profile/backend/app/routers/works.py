from fastapi import APIRouter, Query
from app.models import Work
from app.data.works import WORKS

router = APIRouter(prefix="/api/works", tags=["works"])


@router.get("", response_model=list[Work])
def get_works(owner: str | None = Query(default=None)):
    if owner:
        slug = owner.lower().replace(" ", "-")
        return [w for w in WORKS if w["owner"].lower().replace(" ", "-") == slug]
    return WORKS
