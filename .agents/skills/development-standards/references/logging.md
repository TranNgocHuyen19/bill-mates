# Logging Standards (UniSage Agent)

## 1. Principle
Tất cả thông tin hệ thống (Graph run execution, Ingestion progress, Database Query errors) đều phải được log rõ ràng theo định dạng Structured Logging.

## 2. Logger Setup
Dùng module `logging` tiêu chuẩn với cấu hình qua `app/core/logging.py`:

```python
import logging

logger = logging.getLogger(__name__)

# Ví dụ ghi log trong RAG Node
logger.info("Thực hiện Hybrid Search cho query='%s', faculty='%s'", query, faculty)
logger.error("Lỗi khi kết nối pgvector database: %s", str(e), exc_info=True)
```

## 3. Log Levels Guide
- `DEBUG`: Chi tiết kỹ thuật khi dev (nội dung prompt thô, vector values).
- `INFO`: Thông tin luồng chạy bình thường (bắt đầu Ingest, chạy Graph Node X, trả lời thành công).
- `WARNING`: Cảnh báo không làm ngắt chương trình (Không tìm thấy tài liệu trong DB, fallback dùng AI tổng quát).
- `ERROR`: Lỗi hệ thống cần xử lý (DB timeout, OpenAI API 500 error).
