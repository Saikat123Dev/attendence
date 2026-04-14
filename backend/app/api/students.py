import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.auth import get_current_user, get_current_teacher, get_current_student
from app.models import User, Student, AttendanceRecord, AttendanceStatus
from app.schemas import StudentCreate, StudentResponse, StudentDetailResponse, StudentListItem
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Create a new student (teacher only)"""
    student_service = StudentService(db)
    if student_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required when a teacher creates a student profile",
        )

    try:
        student = await student_service.create_student(student_data, student_data.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception:
        logger.exception("Failed to create student profile for user_id=%s", student_data.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create student profile",
        )

    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        roll_number=student.roll_number,
        registration_number=student.registration_number,
        branch=student.branch,
        semester=student.semester,
        full_name=student.user.full_name if student.user else "",
        email=student.user.email if student.user else "",
        attendance_percentage=0.0,
    )


@router.post("/me", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_my_student_profile(
    student_data: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Create student profile for current user (student self-registration)"""
    student_service = StudentService(db)

    # Check if student already exists
    existing = await student_service.get_student_by_user_id(current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile already exists"
        )

    try:
        student = await student_service.create_student(student_data, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception:
        logger.exception("Failed to create self-service student profile for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create student profile",
        )

    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        roll_number=student.roll_number,
        registration_number=student.registration_number,
        branch=student.branch,
        semester=student.semester,
        full_name=current_user.full_name,
        email=current_user.email,
        attendance_percentage=0.0,
    )


@router.get("/", response_model=List[StudentListItem])
async def list_students(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all students"""
    student_service = StudentService(db)
    students = await student_service.get_all_students(skip, limit)
    return [
        StudentListItem(
            id=s.id,
            roll_number=s.roll_number,
            registration_number=s.registration_number,
            branch=s.branch,
            semester=s.semester,
            full_name=s.user.full_name if s.user else "",
            attendance_percentage=s.stats.attendance_percentage if s.stats else 0.0,
        )
        for s in students
    ]


@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get student details with attendance summary"""
    student_service = StudentService(db)
    student = await student_service.get_student_by_id(student_id)

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    return StudentDetailResponse(
        id=student.id,
        user_id=student.user_id,
        roll_number=student.roll_number,
        registration_number=student.registration_number,
        branch=student.branch,
        semester=student.semester,
        full_name=student.user.full_name if student.user else "",
        email=student.user.email if student.user else "",
        attendance_percentage=student.stats.attendance_percentage if student.stats else 0.0,
        subject_wise_attendance=student_service.build_subject_wise_attendance(student),
    )


@router.get("/me/dashboard", response_model=StudentDetailResponse)
async def get_my_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Get current student's dashboard"""
    student_service = StudentService(db)
    student = await student_service.get_student_by_user_id(current_user.id)

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    return StudentDetailResponse(
        id=student.id,
        user_id=student.user_id,
        roll_number=student.roll_number,
        registration_number=student.registration_number,
        branch=student.branch,
        semester=student.semester,
        full_name=student.user.full_name if student.user else "",
        email=student.user.email if student.user else "",
        attendance_percentage=student.stats.attendance_percentage if student.stats else 0.0,
        subject_wise_attendance=student_service.build_subject_wise_attendance(student),
    )
