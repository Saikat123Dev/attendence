import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models import User, UserRole


class UserModelTimestampTest(unittest.TestCase):
    def test_user_insert_sets_created_and_updated_timestamps(self) -> None:
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)

        with Session(engine) as session:
            user = User(
                email="student@example.com",
                hashed_password="hashed-password",
                full_name="Student User",
                role=UserRole.STUDENT,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            self.assertIsNotNone(user.created_at)
            self.assertIsNotNone(user.updated_at)


if __name__ == "__main__":
    unittest.main()
