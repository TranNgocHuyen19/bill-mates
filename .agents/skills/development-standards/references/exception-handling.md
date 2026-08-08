# Exception Handling Guidelines

## 1. Exception Hierarchy
Mọi ngoại lệ tự định nghĩa phải kế thừa từ `AppException` trong `app/core/exceptions.py`.

```python
class AppException(Exception):
    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR", status_code: int = 500):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(message)

class DocumentNotFoundError(AppException):
    def __init__(self, doc_id: str):
        super().__init__(
            message=f"Không tìm thấy tài liệu ID: {doc_id}",
            error_code="DOCUMENT_NOT_FOUND",
            status_code=404
        )

class RAGSearchError(AppException):
    def __init__(self, detail: str):
        super().__init__(
            message=f"Lỗi khi thực hiện Hybrid Vector Search: {detail}",
            error_code="RAG_SEARCH_FAILED",
            status_code=500
        )
```

## 2. Exception Chaining
Khi catch một exception thấp hơn và raise exception mới, **BẮT BUỘC** dùng `from e`:

```python
try:
    vector = await embedding_service.embed(query)
except Exception as e:
    raise RAGSearchError(str(e)) from e
```

## 3. Global Exception Handler
Middleware trong `app/core/middleware.py` bắt tất cả `AppException` và trả về JSON chuẩn:

```json
{
  "status": "error",
  "error_code": "DOCUMENT_NOT_FOUND",
  "message": "Không tìm thấy tài liệu ID: doc_123"
}
```
