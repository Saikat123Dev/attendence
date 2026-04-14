from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
}

# asyncpg requires ssl='require' to be passed directly, not via URL params
if settings.DATABASE_URL.startswith("postgresql+asyncpg://"):
    engine_kwargs["connect_args"] = {"ssl": "require"}

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def ensure_database_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        if conn.dialect.name != "postgresql":
            return

        await conn.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                """
            )
        )
        await conn.execute(
            text(
                """
                UPDATE users
                SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
                WHERE updated_at IS NULL
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE users
                ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE users
                ALTER COLUMN updated_at SET NOT NULL
                """
            )
        )


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
