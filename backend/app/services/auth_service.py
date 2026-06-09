from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from ..models import User
from ..models.user import UserRole
from ..schemas.user import UserCreate, UserUpdate, UserResponse
from ..repositories import UserRepository
from ..errors import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    UserAlreadyExistsError,
)


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, user_data: UserCreate) -> tuple[User, str, str]:
        """
        Register a new user.
        Returns tuple of (user, access_token, refresh_token)
        """
        # Check if email exists
        if await self.user_repo.email_exists(user_data.email):
            raise EmailAlreadyExistsError()

        # Create user
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            role=UserRole.STUDENT,
        )
        user = await self.user_repo.create(user)

        # Generate tokens
        access_token = create_access_token(str(user.id), extra_claims={
            "role": user.role.value,
            "email": user.email,
        })
        refresh_token = create_refresh_token(str(user.id))

        return user, access_token, refresh_token

    async def login(self, email: str, password: str) -> tuple[User, str, str]:
        """
        Authenticate user and return tokens.
        Returns tuple of (user, access_token, refresh_token)
        """
        user = await self.user_repo.get_by_email(email)

        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise UserAlreadyExistsError("Account is deactivated")

        access_token = create_access_token(str(user.id), extra_claims={
            "role": user.role.value,
            "email": user.email,
        })
        refresh_token = create_refresh_token(str(user.id))

        return user, access_token, refresh_token

    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str]:
        """
        Refresh access and refresh tokens.
        Returns tuple of (new_access_token, new_refresh_token)
        """
        subject = verify_token(refresh_token, expected_type="refresh")

        if not subject:
            raise InvalidCredentialsError("Invalid refresh token")

        user = await self.user_repo.get_by_id(UUID(subject))

        if not user:
            raise UserNotFoundError()

        if not user.is_active:
            raise UserAlreadyExistsError("Account is deactivated")

        new_access_token = create_access_token(str(user.id), extra_claims={
            "role": user.role.value,
            "email": user.email,
        })
        new_refresh_token = create_refresh_token(str(user.id))

        return new_access_token, new_refresh_token


class UserService:
    """Service for user management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_by_id(self, user_id: UUID) -> User:
        """Get user by ID."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return user

    async def get_by_email(self, email: str) -> User:
        """Get user by email."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise UserNotFoundError()
        return user

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[User], int]:
        """Get paginated users."""
        return await self.user_repo.get_paginated(
            page=page,
            page_size=page_size,
            role=role,
            is_active=is_active,
            search=search,
        )

    async def update(self, user_id: UUID, data: UserUpdate) -> User:
        """Update user profile."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        # Check email uniqueness
        if data.email and data.email != user.email:
            if await self.user_repo.email_exists(data.email, exclude_id=user_id):
                raise EmailAlreadyExistsError()

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        return await self.user_repo.update(user)

    async def toggle_active(self, user_id: UUID) -> User:
        """Toggle user active status."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        user.is_active = not user.is_active
        return await self.user_repo.update(user)

    async def delete(self, user_id: UUID) -> None:
        """Delete a user (soft delete by deactivating)."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        user.is_active = False
        await self.user_repo.update(user)

    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str
    ) -> None:
        """Change user password."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()

        if not verify_password(current_password, user.password_hash):
            raise InvalidCredentialsError("Current password is incorrect")

        user.password_hash = get_password_hash(new_password)
        await self.user_repo.update(user)

    async def create_admin(
        self,
        email: str,
        password: str,
        full_name: str
    ) -> User:
        """Create an admin user."""
        if await self.user_repo.email_exists(email):
            raise EmailAlreadyExistsError()

        user = User(
            email=email,
            password_hash=get_password_hash(password),
            full_name=full_name,
            role=UserRole.ADMIN,
        )
        return await self.user_repo.create(user)
