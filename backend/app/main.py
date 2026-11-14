"""
Application entrypoint. Run with:
    uvicorn app.main:app --reload --port 8000
"""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import engine, Base
from app.config import settings
from app.routers import auth_router, courses_router, tutor_router, progress_router

logging.basicConfig(level=logging.INFO)

# Creates all tables on startup if they don't already exist (SQLite-friendly;
# for Postgres in production you'd typically switch to Alembic migrations).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Course Generator API",
    description="Generates personalized courses on any topic using an LLM.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches anything not already handled so the API never leaks a raw 500 traceback."""
    logging.exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


app.include_router(auth_router.router)
app.include_router(courses_router.router)
app.include_router(tutor_router.router)
app.include_router(progress_router.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Course Generator API"}


@app.get("/health")
def health():
    return {"status": "healthy", "llm_model": settings.LLM_MODEL}
