from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
import time

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_qr_token(session_id: int, timestamp: int) -> str:
    """
    Generate a dynamic QR token based on session_id and timestamp.
    Token changes every QR_TOKEN_EXPIRE_SECONDS (2 seconds).
    """
    data = f"{session_id}:{timestamp}:{settings.SECRET_KEY}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]


def get_current_token_timestamp() -> int:
    """Get the current token timestamp (changes every 2 seconds)"""
    return int(time.time()) // settings.QR_TOKEN_EXPIRE_SECONDS


def is_qr_token_valid(session_id: int, token: str, provided_timestamp: int) -> bool:
    """Verify if the provided QR token is valid for the given session"""
    expected_timestamp = provided_timestamp // settings.QR_TOKEN_EXPIRE_SECONDS
    current_timestamp = get_current_token_timestamp()

    # Token is valid for current or immediately adjacent time windows
    if abs(current_timestamp - expected_timestamp) > 1:
        return False

    expected_token = generate_qr_token(session_id, expected_timestamp * settings.QR_TOKEN_EXPIRE_SECONDS)
    return token == expected_token


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data) -> "User":
        from app.models import User, UserRole
        # Convert string role to enum - handle case insensitively
        role_value = user_data.role.lower()
        role = UserRole(role_value)

        user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            role=role,
        )
        self.db.add(user)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            if "email" in str(exc).lower():
                raise ValueError("Email already registered") from exc
            raise
        except Exception:
            await self.db.rollback()
            raise
        await self.db.refresh(user)
        return user

    async def authenticate_user(self, credentials) -> Optional["User"]:
        from app.models import User
        result = await self.db.execute(select(User).where(User.email == credentials.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(credentials.password, user.hashed_password):
            return None
        return user

    async def get_user_by_id(self, user_id: int) -> Optional["User"]:
        from app.models import User
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional["User"]:
        from app.models import User
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    def create_token_for_user(self, user) -> str:
        token_data = {"sub": str(user.id), "role": user.role.value, "email": user.email}
        return create_access_token(token_data)

    @staticmethod
    def get_user_from_token(token: str) -> Optional[dict]:
        return decode_token(token)
