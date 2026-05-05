from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import test
from app.api.routes import gate
from app.api.routes import dashboard
from app.api.routes import auth
from app.api.routes import members
from app.api.routes import events
from app.api.routes import reports

app = FastAPI()

# 🔥 CORS (WAJIB UNTUK REACT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # nanti bisa dibatasi ke localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(test.router)
app.include_router(gate.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(events.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}