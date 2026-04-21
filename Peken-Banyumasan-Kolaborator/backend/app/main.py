from fastapi import FastAPI

from app.api.routes import auth, dashboard, event, notifikasi, pengaturan, portofolio, profile, story, test


app = FastAPI(title="Peken Banyumasan Kolaborator API")

app.include_router(test.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(event.router)
app.include_router(profile.router)
app.include_router(story.router)
app.include_router(portofolio.router)
app.include_router(notifikasi.router)
app.include_router(pengaturan.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Backend Kolaborator is running"}
