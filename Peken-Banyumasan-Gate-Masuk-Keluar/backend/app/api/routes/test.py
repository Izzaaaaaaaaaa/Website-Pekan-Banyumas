from fastapi import APIRouter

# CARRYOVER fix: /test/db route removed — it was unauthenticated and exposed
# raw DB data. Route file kept empty so the import in main.py still resolves
# without a module-not-found error.

router = APIRouter(prefix="/test", tags=["Test"])