from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.auth import get_current_user, get_current_teacher, get_current_student
from app.models import User, AttendanceSession
from app.schemas import (
    SessionCreate,
    SessionResponse,
    QRCodeResponse,
    AttendanceMarkRequest,
    AttendanceStatsResponse,
    AttendanceHistoryItemResponse,
)
from app.services.attendance_service import AttendanceService
from app.services.student_service import StudentService

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/session/start", response_model=SessionResponse)
async def start_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Start a new attendance session (teacher only)"""
    attendance_service = AttendanceService(db)
    try:
        session = await attendance_service.create_session(session_data.subject_id, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return SessionResponse.model_validate(session)


@router.get("/session/{session_id}/qr", response_model=QRCodeResponse)
async def get_qr_code(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Get current dynamic QR code for active session (teacher only)"""
    attendance_service = AttendanceService(db)
    session = await attendance_service.get_session_by_id(session_id)

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Check if teacher owns this session
    if session.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this session")

    if not session.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not active")

    try:
        qr_data = await attendance_service.generate_qr_code(session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return QRCodeResponse(**qr_data)


@router.post("/session/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """End an active attendance session (teacher only)"""
    attendance_service = AttendanceService(db)
    session = await attendance_service.get_session_by_id(session_id)

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this session")

    session = await attendance_service.end_session(session_id)
    return SessionResponse.model_validate(session)


@router.get("/session/{session_id}/students")
async def get_session_students(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Get list of students who marked attendance in this session"""
    attendance_service = AttendanceService(db)
    records = await attendance_service.get_session_attendance_list(session_id)
    return [
        {
            "student_id": r.student_id,
            "student_name": r.student.user.full_name if r.student.user else "",
            "roll_number": r.student.roll_number if r.student else "",
            "status": r.status.value,
            "marked_at": r.marked_at.isoformat() if r.marked_at else None,
        }
        for r in records
    ]


@router.post("/mark", response_model=dict)
async def mark_attendance(
    data: AttendanceMarkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Mark attendance using QR code (student only)"""
    student_service = StudentService(db)
    student = await student_service.get_student_by_user_id(current_user.id)

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    attendance_service = AttendanceService(db)
    success, message = await attendance_service.mark_attendance(
        student_id=student.id,
        session_id=data.session_id,
        token=data.token,
        timestamp=data.timestamp,
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return {"message": message}


@router.get("/stats/me", response_model=AttendanceStatsResponse)
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Get current student's attendance statistics"""
    student_service = StudentService(db)
    student = await student_service.get_student_by_user_id(current_user.id)

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    if not student.stats:
        return {
            "total_classes": 0,
            "total_present": 0,
            "total_absent": 0,
            "attendance_percentage": 0.0,
            "subject_wise": StudentService.build_subject_wise_attendance(student),
        }

    return {
        "total_classes": student.stats.total_classes,
        "total_present": student.stats.total_present,
        "total_absent": student.stats.total_absent,
        "attendance_percentage": student.stats.attendance_percentage,
        "subject_wise": StudentService.build_subject_wise_attendance(student),
    }


@router.get("/history/me", response_model=list[AttendanceHistoryItemResponse])
async def get_my_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Get current student's attendance history"""
    student_service = StudentService(db)
    student = await student_service.get_student_by_user_id(current_user.id)

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    return student_service.build_attendance_history(student)
