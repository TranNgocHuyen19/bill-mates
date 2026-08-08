# API Standards (FastAPI - UniSage Agent)

## 1. Structure
Tất cả API Endpoints nằm ở `app/api/v1/` và đăng ký vào Main Router trong `app/api/v1/__init__.py`.

## 2. Standard Response Format
Sử dụng Pydantic schemas nhất quán cho API Output:

```python
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: T
    message: str | None = None

class PaginationMetadata(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: list[T]
    meta: PaginationMetadata
```

## 3. HTTP Status Codes
- `200 OK`: Trả lời truy vấn thành công (GET, POST chat completions).
- `201 Created`: Tạo tài liệu / Ingest chunks thành công.
- `400 Bad Request`: Payload sai định dạng validation.
- `401 Unauthorized`: Thiếu Header `X-User-Id` hoặc JWT Token hỏng.
- `404 Not Found`: Không tìm thấy Tài liệu / Document ID.
- `500 Internal Server Error`: Lỗi hệ thống không lường trước.
