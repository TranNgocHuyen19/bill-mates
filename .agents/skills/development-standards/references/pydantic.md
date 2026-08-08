# Pydantic v2 Validation Guidelines

## 1. ConfigDict Usage
Luôn dùng `model_config = ConfigDict(...)` thay vì class `Config` cũ trong Pydantic v1.

```python
from pydantic import BaseModel, ConfigDict, Field

class ChunkSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    doc_id: str
    content: str = Field(..., min_length=1, description="Nội dung văn bản chunk")
    chunk_index: int = Field(ge=0)
```

## 2. Field Constraints
Định nghĩa rõ ràng điều kiện dữ liệu bằng `Field()`:
- `ge=0`, `le=100`: Giới hạn số nguyên/thực.
- `min_length=1`: Giới hạn độ dài chuỗi.
- `description="..."`: Mô tả để xuất Swagger UI docs.

## 3. Custom Validators
Dùng `@field_validator` để kiểm tra logic phức tạp:

```python
from pydantic import field_validator

class ChatRequest(BaseModel):
    query: str
    user_faculty: str

    @field_validator("query")
    @classmethod
    def validate_query_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Câu hỏi không được để trống hoặc chỉ chứa khoảng trắng.")
        return v
```
