# Database & Repositories Guidelines (SQLAlchemy 2.0 Async)

## 1. Stack
- ORM: SQLAlchemy 2.0 (Async Extension)
- Driver: `asyncpg`
- Vector DB extension: `pgvector`
- Migrations: `alembic`

## 2. Models Naming & Convention
- Tên bảng: Số nhiều (`documents`, `document_chunks`, `users`).
- Model class: PascalCase số ít (`DocumentModel`, `ChunkModel`).
- Khóa chính: `id` kiểu `UUID` (`uuid_generate_v4()`).
- Bắt buộc có các cột Audit: `created_at`, `updated_at`, `is_active`.

## 3. Repositories Pattern (`app/database/repositories/`)
Repositories quản lý trực tiếp các truy vấn SQL/ORM, không viết SQL trong Node/Service.

```python
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import ChunkModel

class ChunkRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_doc_id(self, doc_id: UUID) -> list[ChunkModel]:
        stmt = select(ChunkModel).where(
            ChunkModel.doc_id == doc_id,
            ChunkModel.is_active == True
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
```
