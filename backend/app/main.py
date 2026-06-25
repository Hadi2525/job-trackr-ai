import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, applications, documents

app = FastAPI(
    title="JobTrackr API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(documents.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "JobTrackr API"}
