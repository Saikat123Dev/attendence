import qrcode
import io
import base64
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import AttendanceSession, AttendanceRecord, AttendanceStatus, Student
from app.core.security import generate_qr_token, get_current_token_timestamp, settings as security_settings
from app.services.student_service import StudentService


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.student_service = StudentService(db)

    async def create_session(self, subject_id: int, teacher_id: int) -> AttendanceSession:
        active_session = await self.get_active_session(subject_id)
        if active_session:
            if active_session.teacher_id != teacher_id:
                raise ValueError("Another teacher already has an active session for this subject")
            return active_session

        session = AttendanceSession(
            subject_id=subject_id,
            teacher_id=teacher_id,
            start_time=datetime.now(timezone.utc),
            is_active=True,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_session_by_id(self, session_id: int) -> Optional[AttendanceSession]:
        result = await self.db.execute(
            select(AttendanceSession)
            .options(selectinload(AttendanceSession.records))
            .where(AttendanceSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_active_session(self, subject_id: int) -> Optional[AttendanceSession]:
        result = await self.db.execute(
            select(AttendanceSession)
            .where(
                AttendanceSession.subject_id == subject_id,
                AttendanceSession.is_active == True,
            )
            .order_by(AttendanceSession.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def generate_qr_code(self, session: AttendanceSession) -> dict:
        """Generate dynamic QR code for the session"""
        if not session.is_active:
            raise ValueError("Session is not active")

        timestamp = get_current_token_timestamp()
        # Convert to actual seconds for token generation
        actual_timestamp = timestamp * security_settings.QR_TOKEN_EXPIRE_SECONDS
        token = generate_qr_token(session.id, actual_timestamp)

        # Update session with current token
        session.current_token = token
        session.token_timestamp = timestamp
        await self.db.commit()

        # QR data contains session_id:token:timestamp
        qr_data = f"{session.id}:{token}:{timestamp}"

        # Generate QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        return {
            "session_id": session.id,
            "token": token,
            "timestamp": timestamp,
            "qr_data": qr_data,
            "qr_image": f"data:image/png;base64,{qr_base64}",
        }

    async def mark_attendance(
        self,
        student_id: int,
        session_id: int,
        token: str,
        timestamp: int,
    ) -> tuple[bool, str]:
        """Mark attendance for a student using QR token"""
        # Verify session exists and is active
        session = await self.get_session_by_id(session_id)
        if not session or not session.is_active:
            return False, "Session not found or inactive"

        # Verify token matches
        actual_timestamp = timestamp * security_settings.QR_TOKEN_EXPIRE_SECONDS
        expected_token = generate_qr_token(session_id, actual_timestamp)
        if token != expected_token:
            return False, "Invalid or expired token"

        # Check if student already marked attendance for this session
        existing = await self.db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.session_id == session_id,
                AttendanceRecord.student_id == student_id,
            )
        )
        if existing.scalar_one_or_none():
            return False, "Attendance already marked"

        # Mark attendance
        record = AttendanceRecord(
            session_id=session_id,
            student_id=student_id,
            subject_id=session.subject_id,
            status=AttendanceStatus.PRESENT,
            token_used=token,
        )
        self.db.add(record)

        # Update student stats
        await self.student_service.update_attendance_stats(student_id, AttendanceStatus.PRESENT)

        await self.db.commit()
        return True, "Attendance marked successfully"

    async def end_session(self, session_id: int) -> Optional[AttendanceSession]:
        session = await self.get_session_by_id(session_id)
        if session:
            session.is_active = False
            session.end_time = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(session)
        return session

    async def get_session_attendance_list(self, session_id: int) -> List[AttendanceRecord]:
        result = await self.db.execute(
            select(AttendanceRecord)
            .options(selectinload(AttendanceRecord.student).selectinload(Student.user))
            .where(AttendanceRecord.session_id == session_id)
            .order_by(AttendanceRecord.marked_at.desc())
        )
        return list(result.scalars().all())

    async def get_student_subject_attendance(
        self, student_id: int, subject_id: int
    ) -> dict:
        result = await self.db.execute(
            select(
                func.count(AttendanceRecord.id).label("total"),
            ).where(
                AttendanceRecord.student_id == student_id,
                AttendanceRecord.subject_id == subject_id,
                AttendanceRecord.status == AttendanceStatus.PRESENT,
            )
        )
        return {"present": result.scalar() or 0}
