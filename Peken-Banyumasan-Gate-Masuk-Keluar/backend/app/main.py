from fastapi import FastAPI
from app.api.routes import test
from app.api.routes import gate
from app.api.routes import dashboard
from app.api.routes import auth
from app.api.routes import members
from app.api.routes import events
from app.api.routes import reports

app = FastAPI()

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