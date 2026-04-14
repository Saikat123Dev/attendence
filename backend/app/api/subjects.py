from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.auth import get_current_user, get_current_teacher
from app.models import Subject, User
from app.schemas import SubjectCreate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_data: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_teacher),
):
    """Create a new subject (teacher only)"""
    subject = Subject(
        name=subject_data.name,
        code=subject_data.code,
        teacher_id=current_user.id,
    )
    db.add(subject)
    await db.commit()
    await db.refresh(subject)

    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        teacher_id=subject.teacher_id,
        teacher_name=current_user.full_name,
    )


@router.get("/", response_model=List[SubjectResponse])
async def list_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all subjects"""
    result = await db.execute(select(Subject))
    subjects = result.scalars().all()

    return [
        SubjectResponse(
            id=s.id,
            name=s.name,
            code=s.code,
            teacher_id=s.teacher_id,
            teacher_name=s.teacher.full_name if s.teacher else None,
        )
        for s in subjects
    ]


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get subject details"""
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalar_one_or_none()

    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        teacher_id=subject.teacher_id,
        teacher_name=subject.teacher.full_name if subject.teacher else None,
    )
