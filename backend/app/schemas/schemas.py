from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ============ User Schemas ============
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str
    role: str

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        valid_roles = ['student', 'teacher']
        if v.lower() not in valid_roles:
            raise ValueError(f'Role must be one of: {valid_roles}')
        return v.lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    @field_validator('role', mode='before')
    @classmethod
    def convert_role_to_string(cls, v):
        if hasattr(v, 'value'):  # Handle Enum
            return v.value
        return str(v)

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============ Student Schemas ============
class StudentBase(BaseModel):
    roll_number: str
    registration_number: str
    branch: str
    semester: int


class StudentCreate(StudentBase):
    user_id: Optional[int] = None


class StudentResponse(StudentBase):
    id: int
    user_id: int
    full_name: str
    email: str
    attendance_percentage: float = 0.0

    class Config:
        from_attributes = True


class StudentDetailResponse(StudentResponse):
    subject_wise_attendance: dict = {}


# ============ Subject Schemas ============
class SubjectBase(BaseModel):
    name: str
    code: str


class SubjectCreate(SubjectBase):
    pass


class SubjectResponse(SubjectBase):
    id: int
    teacher_id: int
    teacher_name: Optional[str] = None

    class Config:
        from_attributes = True


# ============ Attendance Session Schemas ============
class SessionCreate(BaseModel):
    subject_id: int


class SessionResponse(BaseModel):
    id: int
    subject_id: int
    teacher_id: int
    start_time: datetime
    end_time: Optional[datetime]
    is_active: bool
    current_token: Optional[str] = None
    token_timestamp: Optional[int] = None

    class Config:
        from_attributes = True


class QRCodeResponse(BaseModel):
    session_id: int
    token: str
    timestamp: int
    qr_data: str
    qr_image: str


# ============ Attendance Record Schemas ============
class AttendanceMarkRequest(BaseModel):
    session_id: int
    token: str
    timestamp: int


class AttendanceRecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    subject_id: int
    status: str
    marked_at: datetime

    class Config:
        from_attributes = True


class AttendanceHistoryItemResponse(BaseModel):
    id: int
    session_id: int
    subject_id: int
    subject_name: str
    status: str
    marked_at: datetime


# ============ Stats Schemas ============
class AttendanceStatsResponse(BaseModel):
    student_id: int
    total_classes: int
    total_present: int
    total_absent: int
    attendance_percentage: float
    subject_wise: dict = {}

    class Config:
        from_attributes = True


class StudentListItem(BaseModel):
    id: int
    roll_number: str
    registration_number: str
    branch: str
    semester: int
    full_name: str
    attendance_percentage: float

    class Config:
        from_attributes = True


class StudentDashboardResponse(BaseModel):
    student: StudentResponse
    subject_wise_attendance: dict
    recent_history: List[AttendanceRecordResponse]
