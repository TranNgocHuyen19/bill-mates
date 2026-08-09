# Hướng dẫn đọc source theo file

Tài liệu này giải thích các file đang có và gợi ý thứ tự đọc. Không cần đọc toàn bộ source
từ trên xuống.

## 1. File ở thư mục gốc

| File/thư mục       | Vai trò                                                         |
| ------------------ | --------------------------------------------------------------- |
| `README.md`        | Tổng quan, cấu hình và cách chạy                                |
| `backend/`         | API, database, OCR và test Python                               |
| `frontend/`        | Web app Next.js                                                 |
| `docs/`            | SRS, sơ đồ và tài liệu kỹ thuật                                 |
| `.agents/`         | Quy ước/skill dành cho coding agent, không tham gia runtime     |
| `.stitch/`         | Metadata thiết kế được đồng bộ từ Google Stitch                 |
| `skills-lock.json` | Khóa phiên bản các skill công cụ, không phải dependency của app |

## 2. Backend

### Điểm bắt đầu

| File                        | Đọc để hiểu                                            |
| --------------------------- | ------------------------------------------------------ |
| `backend/src/main.py`       | Tạo FastAPI app, CORS và đăng ký toàn bộ router        |
| `backend/src/config.py`     | Tất cả biến môi trường backend và cấu hình OCR         |
| `backend/src/api.py`        | Request ID và định dạng lỗi chung                      |
| `backend/src/database.py`   | Engine PostgreSQL async và một session cho mỗi request |
| `backend/src/models.py`     | Base model, mixin ID/thời gian và các enum dùng chung  |
| `backend/src/exceptions.py` | `AppError` dùng để trả lỗi nghiệp vụ nhất quán         |

Nên bắt đầu từ `main.py`, mở một `router.py`, đi tiếp qua `service.py`, rồi mới đọc
`repository.py` và `models.py`.

### Xác thực và người dùng

| File                                | Vai trò                                |
| ----------------------------------- | -------------------------------------- |
| `backend/src/auth/router.py`        | Endpoint kiểm tra người dùng hiện tại  |
| `backend/src/users/dependencies.py` | Đọc và xác minh Supabase JWT           |
| `backend/src/users/router.py`       | Hồ sơ và tài khoản thanh toán          |
| `backend/src/users/service.py`      | Tạo đồng bộ profile lần đầu, sửa hồ sơ |
| `backend/src/users/models.py`       | Bảng `profiles`, `payment_accounts`    |
| `backend/src/users/schemas.py`      | Kiểu request/response người dùng       |

### Phòng

| File                              | Vai trò                                               |
| --------------------------------- | ----------------------------------------------------- |
| `backend/src/rooms/router.py`     | API phòng, thành viên, lời mời và danh mục            |
| `backend/src/rooms/service.py`    | Quyền owner/admin/member và nghiệp vụ phòng           |
| `backend/src/rooms/repository.py` | Query phòng và thành viên                             |
| `backend/src/rooms/models.py`     | `rooms`, `room_members`, `room_invites`, `categories` |
| `backend/src/rooms/schemas.py`    | Dữ liệu vào/ra của module phòng                       |

### Khoản chi và OCR

| File                                   | Vai trò                                                                |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `backend/src/expenses/router.py`       | API đơn nháp, món, phần chia, ảnh và OCR                               |
| `backend/src/expenses/service.py`      | Transaction tạo/sửa/post/hủy hóa đơn và Storage                        |
| `backend/src/expenses/repository.py`   | Query hóa đơn, item, split và receipt                                  |
| `backend/src/expenses/calculations.py` | Thuật toán chia tiền và kiểm tra sai số                                |
| `backend/src/expenses/ocr.py`          | Khởi tạo PaddleOCR và đổi dòng chữ thành gợi ý món                     |
| `backend/src/expenses/models.py`       | `expenses`, `expense_items`, `expense_item_splits`, `expense_receipts` |
| `backend/src/expenses/schemas.py`      | Kiểu dữ liệu hóa đơn và kết quả OCR                                    |

Hai file quan trọng nhất để hiểu OCR là `ocr.py` và đoạn receipt trong `service.py`.
`ocr.py` chỉ nhận ảnh và trả dữ liệu; `service.py` quản lý trạng thái, tải ảnh từ Storage
và lưu `ocr_data`.

### Công nợ và thanh toán

| File                              | Vai trò                                         |
| --------------------------------- | ----------------------------------------------- |
| `backend/src/debts/router.py`     | API số dư, settlement và bằng chứng thanh toán  |
| `backend/src/debts/service.py`    | Tối ưu công nợ, xác nhận/từ chối/hủy thanh toán |
| `backend/src/debts/repository.py` | Query split và settlement                       |
| `backend/src/debts/models.py`     | `settlements`, `settlement_receipts`            |
| `backend/src/debts/schemas.py`    | Kiểu dữ liệu số dư và thanh toán                |

### Báo cáo và nhật ký

| File                                 | Vai trò                           |
| ------------------------------------ | --------------------------------- |
| `backend/src/reports/router.py`      | API báo cáo JSON và tải Excel     |
| `backend/src/reports/service.py`     | Tổng hợp số liệu theo khoảng ngày |
| `backend/src/reports/repository.py`  | Query hóa đơn đã post             |
| `backend/src/reports/workbook.py`    | Tạo workbook `.xlsx`              |
| `backend/src/reports/schemas.py`     | Cấu trúc dữ liệu báo cáo          |
| `backend/src/activity/router.py`     | API nhật ký hoạt động             |
| `backend/src/activity/service.py`    | Ghi và đọc nhật ký                |
| `backend/src/activity/repository.py` | Query `activity_logs`             |

### Migration và test

| File/thư mục                                                               | Vai trò                                  |
| -------------------------------------------------------------------------- | ---------------------------------------- |
| `backend/alembic.ini`                                                      | Cấu hình Alembic                         |
| `backend/migrations/env.py`                                                | Kết nối Alembic với metadata SQLAlchemy  |
| `backend/migrations/versions/2026-08-08_create_bill_mates_schema.py`       | Tạo schema BillMates                     |
| `backend/migrations/versions/2026-08-09_create_receipts_storage_bucket.py` | Tạo bucket private `receipts`            |
| `backend/tests/`                                                           | Unit/service test theo từng module       |
| `backend/tests/expenses/test_ocr.py`                                       | Test parser OCR không cần tải model thật |
| `backend/requirements.txt`                                                 | Dependency runtime                       |
| `backend/requirements-dev.txt`                                             | Dependency test/lint và runtime          |

`backend/src/supabase.py` là wrapper PostgREST cũ. Luồng nghiệp vụ chính hiện tại dùng
SQLAlchemy trong các repository; Storage vẫn được gọi qua HTTP từ service.

## 3. Frontend

### Điểm bắt đầu và hạ tầng chung

| File                                     | Vai trò                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `frontend/app/layout.tsx`                | Root layout, font, theme, query provider và navigation |
| `frontend/app/globals.css`               | Token màu, typography và style toàn cục                |
| `frontend/proxy.ts`                      | Chạy Supabase session proxy cho các route              |
| `frontend/lib/config.ts`                 | Kiểm tra biến môi trường bằng Zod                      |
| `frontend/services/api.ts`               | Axios client, gắn JWT và xử lý lỗi 401/4xx/5xx         |
| `frontend/lib/supabase/client.ts`        | Supabase client chạy trên browser                      |
| `frontend/lib/supabase/server.ts`        | Supabase client cho server component                   |
| `frontend/lib/supabase/proxy.ts`         | Làm mới cookie/session và bảo vệ route                 |
| `frontend/components/query-provider.tsx` | Khởi tạo TanStack Query                                |
| `frontend/components/navbar.tsx`         | Thanh trên và drawer mobile kéo từ phải                |
| `frontend/components/bottom-nav.tsx`     | Điều hướng chính trên mobile                           |

### Route trong `app/`

| Route                   | File                                         |
| ----------------------- | -------------------------------------------- |
| `/`                     | `frontend/app/page.tsx`                      |
| `/auth/login`           | `frontend/app/auth/login/page.tsx`           |
| `/auth/register`        | `frontend/app/auth/register/page.tsx`        |
| `/auth/forgot-password` | `frontend/app/auth/forgot-password/page.tsx` |
| `/auth/reset-password`  | `frontend/app/auth/reset-password/page.tsx`  |
| `/rooms`                | `frontend/app/rooms/page.tsx`                |
| `/rooms/[id]`           | `frontend/app/rooms/[id]/page.tsx`           |
| `/rooms/[id]/settings`  | `frontend/app/rooms/[id]/settings/page.tsx`  |
| `/rooms/join/[token]`   | `frontend/app/rooms/join/[token]/page.tsx`   |
| `/expenses`             | `frontend/app/expenses/page.tsx`             |
| `/expenses/new`         | `frontend/app/expenses/new/page.tsx`         |
| `/expenses/new/split`   | `frontend/app/expenses/new/split/page.tsx`   |
| `/expenses/new/confirm` | `frontend/app/expenses/new/confirm/page.tsx` |
| `/debts`                | `frontend/app/debts/page.tsx`                |
| `/debts/settle`         | `frontend/app/debts/settle/page.tsx`         |
| `/reports`              | `frontend/app/reports/page.tsx`              |
| `/history`              | `frontend/app/history/page.tsx`              |
| `/profile`              | `frontend/app/profile/page.tsx`              |
| `/about`                | `frontend/app/about/page.tsx`                |

Các route `/login`, `/register`, `/forgot-password`, `/reset-password` ở root là route
tương thích cũ và chuyển người dùng sang nhóm `/auth/...`.

### Feature modules

| Module              | Component chính                                      | Chức năng                    |
| ------------------- | ---------------------------------------------------- | ---------------------------- |
| `features/auth`     | `login-form.tsx`, `register-form.tsx`                | Đăng nhập và tài khoản       |
| `features/rooms`    | `room-dashboard-page.tsx`                            | Phòng, thành viên, danh mục  |
| `features/expenses` | `expense-create-page.tsx`, `expense-item-editor.tsx` | Đơn nháp và chia theo món    |
| `features/expenses` | `ocr-upload-card.tsx`, `ocr-receipt-review.tsx`      | Upload và duyệt OCR          |
| `features/debts`    | `debts-list-page.tsx`, `settle-debt-page.tsx`        | Công nợ và thanh toán        |
| `features/reports`  | `reports-page.tsx`                                   | KPI, chart, bộ lọc và Excel  |
| `features/activity` | `activity-history-page.tsx`                          | Nhật ký phòng                |
| `features/users`    | `profile-page.tsx`                                   | Hồ sơ và tài khoản ngân hàng |

Trong mỗi feature:

- `api/index.ts`: URL và HTTP method.
- `queries/index.ts`: query key, cache và mutation.
- `schemas/index.ts`: kiểm tra form bằng Zod.
- `components/`: phần giao diện.
- `index.ts`: export gọn cho nơi khác import.

### Tiện ích frontend

| File                            | Vai trò                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `frontend/lib/money.ts`         | Format số tiền VND                                        |
| `frontend/lib/local-storage.ts` | Key và helper localStorage                                |
| `frontend/lib/error-handler.ts` | Đổi lỗi API thành thông báo dễ hiểu                       |
| `frontend/lib/toast.ts`         | Thông báo thành công/lỗi                                  |
| `frontend/lib/utils.ts`         | Ghép class Tailwind và chuẩn hóa đường dẫn                |
| `frontend/components/ui/`       | Primitive UI dùng lại: button, input, card, badge, select |

## 4. Thứ tự đọc theo một tính năng

Ví dụ muốn hiểu “quét bill rồi chia từng món”:

1. `frontend/app/expenses/new/page.tsx`
2. `frontend/features/expenses/components/expense-create-page.tsx`
3. `frontend/features/expenses/api/index.ts`
4. `backend/src/expenses/router.py`
5. `backend/src/expenses/service.py`
6. `backend/src/expenses/ocr.py`
7. `backend/src/expenses/repository.py`
8. `backend/src/expenses/models.py`
9. `backend/tests/expenses/test_ocr.py`

Ví dụ muốn hiểu “report và xuất Excel”:

1. `frontend/app/reports/page.tsx`
2. `frontend/features/reports/components/reports-page.tsx`
3. `frontend/features/reports/api/index.ts`
4. `backend/src/reports/router.py`
5. `backend/src/reports/service.py`
6. `backend/src/reports/workbook.py`
7. `backend/tests/reports/test_service.py`
