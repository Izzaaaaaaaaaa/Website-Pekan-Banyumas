from fastapi import FastAPI
from app.api.routes import test
from app.api.routes import gate
app = FastAPI()

app.include_router(test.router)
app.include_router(gate.router)
@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}