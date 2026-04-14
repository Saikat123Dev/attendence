from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, ensure_database_schema
from app.api import auth_router, students_router, attendance_router, subjects_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and repair older schemas
    await ensure_database_schema()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(attendance_router)
app.include_router(subjects_router)


@app.get("/")
async def root():
    return {"message": "Attendance Management System API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/test-register")
async def test_register():
    """Test endpoint to verify registration works"""
    return {"status": "ok", "message": "Test endpoint working"}
