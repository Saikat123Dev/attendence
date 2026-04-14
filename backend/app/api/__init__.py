from app.api.auth import router as auth_router
from app.api.students import router as students_router
from app.api.attendance import router as attendance_router
from app.api.subjects import router as subjects_router

__all__ = ["auth_router", "students_router", "attendance_router", "subjects_router"]
