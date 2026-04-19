from fastapi import FastAPI
from app.api.routes import test
from app.api.routes import gate
from app.api.routes import dashboard

app = FastAPI()

app.include_router(test.router)
app.include_router(gate.router)
app.include_router(dashboard.router)
@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}