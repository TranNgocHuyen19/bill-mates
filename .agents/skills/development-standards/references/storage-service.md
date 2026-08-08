# Storage Service Guidelines

## 1. Storage Organization
Thư mục lưu trữ local được quản lý tại `storage/`:
- `storage/raw/`: Chứa file JSONL cào tự động và tài liệu thô.
- `storage/uploads/`: Chứa file PDF, Excel, DOCX do Admin upload lên qua API Ingestion.

## 2. File Handling Rules
- Luôn kiểm tra định dạng extension cho phép (`.pdf`, `.docx`, `.xlsx`, `.json`, `.txt`).
- Tạo tên file an toàn bằng `uuid4()` để tránh ghi đè hoặc lộ đường dẫn hệ thống.
- Xử lý file async để không chặn event loop của FastAPI:

```python
import aiofiles
from pathlib import Path

async def save_uploaded_file(file_content: bytes, filename: str) -> Path:
    target_path = Path("storage/uploads") / filename
    async with aiofiles.open(target_path, "wb") as f:
        await f.write(file_content)
    return target_path
```
