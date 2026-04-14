from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Student,
    User,
    UserRole,
    AttendanceStats,
    AttendanceRecord,
    AttendanceStatus,
)
from app.schemas import StudentCreate


class StudentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_student(self, student_data: StudentCreate, user_id: int) -> Student:
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        if user.role != UserRole.STUDENT:
            raise ValueError("Student profile can only be created for student accounts")

        student = Student(
            user_id=user_id,
            roll_number=student_data.roll_number,
            registration_number=student_data.registration_number,
            branch=student_data.branch,
            semester=student_data.semester,
        )
        self.db.add(student)
        try:
            await self.db.flush()

            # Initialize attendance stats in the same transaction as the profile.
            self.db.add(AttendanceStats(student_id=student.id))
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise ValueError(self._student_creation_error_message(exc)) from exc
        except Exception:
            await self.db.rollback()
            raise

        created_student = await self.get_student_by_id(student.id)
        return created_student or student

    @staticmethod
    def _student_creation_error_message(exc: IntegrityError) -> str:
        error_message = str(exc).lower()
        if "roll_number" in error_message:
            return "Roll number already exists"
        if "registration_number" in error_message:
            return "Registration number already exists"
        if "user_id" in error_message:
            return "Student profile already exists"
        return "Could not create student profile with the provided details"

    async def get_student_by_id(self, student_id: int) -> Optional[Student]:
        result = await self.db.execute(
            select(Student)
            .options(
                selectinload(Student.user),
                selectinload(Student.stats),
                selectinload(Student.attendance_records).selectinload(AttendanceRecord.subject),
            )
            .where(Student.id == student_id)
        )
        return result.scalar_one_or_none()

    async def get_student_by_user_id(self, user_id: int) -> Optional[Student]:
        result = await self.db.execute(
            select(Student)
            .options(
                selectinload(Student.user),
                selectinload(Student.stats),
                selectinload(Student.attendance_records).selectinload(AttendanceRecord.subject),
            )
            .where(Student.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all_students(self, skip: int = 0, limit: int = 100) -> List[Student]:
        result = await self.db.execute(
            select(Student)
            .options(selectinload(Student.user), selectinload(Student.stats))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_students_by_subject(self, subject_id: int) -> List[Student]:
        # Get all students who have attendance records for this subject
        result = await self.db.execute(
            select(Student)
            .join(AttendanceRecord)
            .where(AttendanceRecord.subject_id == subject_id)
            .distinct()
            .options(selectinload(Student.user), selectinload(Student.stats))
        )
        return list(result.scalars().all())

    async def update_attendance_stats(
        self,
        student_id: int,
        status: AttendanceStatus,
        increment: bool = True,
    ) -> AttendanceStats:
        result = await self.db.execute(
            select(AttendanceStats).where(AttendanceStats.student_id == student_id)
        )
        stats = result.scalar_one_or_none()

        if not stats:
            stats = AttendanceStats(student_id=student_id)
            self.db.add(stats)

        if status == AttendanceStatus.PRESENT:
            stats.total_present += 1 if increment else -1
        else:
            stats.total_absent += 1 if increment else -1

        stats.total_classes += 1 if increment else -1

        if stats.total_classes > 0:
            stats.attendance_percentage = round((stats.total_present / stats.total_classes) * 100, 2)
        else:
            stats.attendance_percentage = 0.0

        await self.db.commit()
        await self.db.refresh(stats)
        return stats

    @staticmethod
    def build_subject_wise_attendance(student: Student) -> dict:
        subject_wise: dict[str, dict] = {}

        for record in student.attendance_records:
            key = str(record.subject_id)
            subject_name = record.subject.name if record.subject else f"Subject {record.subject_id}"
            summary = subject_wise.setdefault(
                key,
                {
                    "subject_id": record.subject_id,
                    "subject_name": subject_name,
                    "present": 0,
                    "absent": 0,
                    "total": 0,
                    "percentage": 0.0,
                },
            )
            summary["total"] += 1
            if record.status == AttendanceStatus.PRESENT:
                summary["present"] += 1
            else:
                summary["absent"] += 1

        for summary in subject_wise.values():
            summary["percentage"] = round(
                (summary["present"] / summary["total"]) * 100, 2
            ) if summary["total"] else 0.0

        return subject_wise

    @staticmethod
    def build_attendance_history(student: Student) -> List[dict]:
        records = sorted(
            student.attendance_records,
            key=lambda record: record.marked_at,
            reverse=True,
        )
        return [
            {
                "id": record.id,
                "session_id": record.session_id,
                "subject_id": record.subject_id,
                "subject_name": record.subject.name if record.subject else f"Subject {record.subject_id}",
                "status": record.status.value,
                "marked_at": record.marked_at,
            }
            for record in records
        ]
