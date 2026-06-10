import asyncio
from dataclasses import dataclass

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, close_db
from app.core.security import get_password_hash
from app.models import User, UserRole


@dataclass(frozen=True)
class SeedUser:
    email: str
    password: str
    full_name: str
    role: UserRole


SEED_USERS = (
    SeedUser("admin@test.com", "admin123456", "Local Admin", UserRole.ADMIN),
    SeedUser("instructor@test.com", "instructor123456", "Local Instructor", UserRole.INSTRUCTOR),
    SeedUser("student@test.com", "student123", "Local Student", UserRole.STUDENT),
)


async def seed_users() -> None:
    async with AsyncSessionLocal() as session:
        for seed_user in SEED_USERS:
            result = await session.execute(
                select(User).where(User.email == seed_user.email)
            )
            user = result.scalar_one_or_none()

            if user:
                user.full_name = seed_user.full_name
                user.role = seed_user.role
                user.password_hash = get_password_hash(seed_user.password)
                user.is_active = True
                print(f"updated {seed_user.email}")
                continue

            session.add(
                User(
                    email=seed_user.email,
                    password_hash=get_password_hash(seed_user.password),
                    full_name=seed_user.full_name,
                    role=seed_user.role,
                    is_active=True,
                )
            )
            print(f"created {seed_user.email}")

        await session.commit()


if __name__ == "__main__":
    async def main() -> None:
        try:
            await seed_users()
        finally:
            await close_db()

    asyncio.run(main())
