from typing import Generic, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeMeta

ModelType = TypeVar("ModelType", bound=DeclarativeMeta)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    def _normalize_id(self, id: UUID | str) -> str:
        return str(id)

    async def get_by_id(self, id: UUID | str) -> Optional[ModelType]:
        result = await self.db.execute(
            select(self.model).where(self.model.id == self._normalize_id(id))
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: ModelType) -> ModelType:
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> None:
        await self.db.delete(obj)
        await self.db.flush()

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()

    async def exists(self, id: UUID | str) -> bool:
        result = await self.db.execute(
            select(func.count())
            .select_from(self.model)
            .where(self.model.id == self._normalize_id(id))
        )
        return result.scalar_one() > 0
