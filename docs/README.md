# Tài liệu BillMates

Thư mục này chứa tài liệu nghiệp vụ gốc và tài liệu kỹ thuật được viết theo source hiện
tại.

## Nên đọc theo thứ tự nào?

1. [README chính](../README.md): tính năng, công nghệ và cách chạy nhanh.
2. [Kiến trúc](ARCHITECTURE.md): các lớp của hệ thống và dữ liệu đi qua đâu.
3. [Hướng dẫn đọc file](FILE_GUIDE.md): vai trò của từng thư mục/file quan trọng.
4. [Cài đặt và vận hành](SETUP_AND_OPERATIONS.md): Supabase local, migration, OCR và Tailscale.
5. [Danh sách API](API_REFERENCE.md): endpoint frontend đang gọi.
6. [SRS gốc](SRS_Room_Expense_Manager_v1.0.docx): yêu cầu nghiệp vụ ban đầu.

## File thiết kế gốc

| File                                           | Nội dung                                 |
| ---------------------------------------------- | ---------------------------------------- |
| `SRS_Room_Expense_Manager_v1.0.docx`           | Đặc tả yêu cầu phần mềm                  |
| `Class Diagram1.jpg`                           | Ảnh class diagram                        |
| `billmates.vpp`                                | Project Visual Paradigm                  |
| `billmates.vpp.bak_000f`, `billmates.vpp.vbak` | Bản sao lưu Visual Paradigm              |
| `project.xml`, `data.zip`                      | Dữ liệu phụ trợ xuất từ công cụ thiết kế |

Các file thiết kế là tài liệu tham khảo. Source, migration Alembic và test mới là mô tả
chính xác nhất về hành vi đang chạy.
