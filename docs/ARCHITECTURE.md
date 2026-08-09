# Kiến trúc và luồng dữ liệu

## 1. Thành phần hệ thống

BillMates tách frontend và backend nhưng dùng chung Supabase chạy local:

| Thành phần | Công nghệ                                      | Trách nhiệm                                           |
| ---------- | ---------------------------------------------- | ----------------------------------------------------- |
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS | Giao diện, form, cache dữ liệu và điều hướng          |
| Backend    | FastAPI, Pydantic, SQLAlchemy async            | Phân quyền, nghiệp vụ, tính chia tiền, báo cáo và OCR |
| Auth       | Supabase Auth local                            | Đăng ký, đăng nhập, reset mật khẩu và phát JWT        |
| Database   | Supabase PostgreSQL local                      | Lưu dữ liệu nghiệp vụ trong Docker volume             |
| Storage    | Supabase Storage local                         | Lưu ảnh bill và bằng chứng trong Docker volume        |
| OCR        | PaddleOCR                                      | Đọc dòng chữ và gợi ý món từ ảnh bill                 |

Tất cả thành phần chạy trên cùng máy Windows. Tailscale Serve cung cấp HTTPS riêng và định
tuyến `/` vào Next.js, `/api` vào FastAPI, còn `/auth`, `/storage`, `/rest` vào Supabase local.
Không có route cho PostgreSQL hoặc Supabase Studio, và Tailscale Funnel luôn tắt.

## 2. Một request đi qua hệ thống như thế nào?

```text
Người dùng
  -> Next.js page
  -> component trong features/<module>/components
  -> TanStack Query hook trong features/<module>/queries
  -> API function trong features/<module>/api
  -> Axios thêm Supabase access token
  -> FastAPI router
  -> service kiểm tra nghiệp vụ
  -> repository truy vấn PostgreSQL
  -> response trở lại frontend
```

Frontend đăng nhập trực tiếp với Supabase Auth. Với API nghiệp vụ, Axios lấy
`session.access_token` và gắn `Authorization: Bearer <token>`. Backend kiểm chữ ký JWT,
`audience`, `issuer`, thời hạn và lấy `sub` làm ID người dùng.

Backend dùng `AsyncSession` và `DATABASE_URL` để đọc/ghi PostgreSQL local. Service-role key
local chỉ dùng khi backend cần thao tác Supabase Storage; key không đi vào frontend hoặc Git.

## 3. Cấu trúc một module backend

Phần lớn module backend dùng cùng quy ước:

```text
<module>/
├── models.py       Bảng và quan hệ SQLAlchemy
├── schemas.py      Request/response Pydantic
├── repository.py   Câu truy vấn và thao tác dữ liệu
├── service.py      Luật nghiệp vụ, phân quyền, transaction
└── router.py       HTTP endpoint
```

Luồng phụ thuộc luôn đi từ `router -> service -> repository`. Router không tự tính công
nợ hoặc sửa database. Repository không quyết định người dùng có quyền thao tác hay không.

## 4. Cấu trúc một feature frontend

```text
features/<module>/
├── api/             Hàm gọi HTTP và type dữ liệu trả về
├── queries/         TanStack Query hooks, cache key, mutation
├── schemas/         Zod schema cho form
├── components/      Giao diện và tương tác của module
└── index.ts         Public exports của feature
```

Các file trong `app/` chủ yếu là route mỏng. Phần giao diện và nghiệp vụ phía client nằm
trong `features/` để dễ đọc và test.

## 5. Mô hình dữ liệu chính

```text
profiles
  ├── payment_accounts
  └── room_members ── rooms
                       ├── room_invites
                       ├── categories
                       ├── expenses
                       │    ├── expense_items
                       │    │    └── expense_item_splits
                       │    └── expense_receipts
                       ├── settlements
                       │    └── settlement_receipts
                       └── activity_logs
```

| Bảng                  | Ý nghĩa                                             |
| --------------------- | --------------------------------------------------- |
| `profiles`            | Hồ sơ tương ứng với người dùng Supabase Auth        |
| `payment_accounts`    | Tài khoản ngân hàng/ví phục vụ VietQR               |
| `rooms`               | Phòng trọ hoặc nhóm chia tiền                       |
| `room_members`        | Thành viên, vai trò và trạng thái trong phòng       |
| `room_invites`        | Link/token mời vào phòng                            |
| `categories`          | Loại chi tiêu riêng của phòng                       |
| `expenses`            | Phần đầu hóa đơn, người trả, ngày chi và trạng thái |
| `expense_items`       | Các món thuộc một hóa đơn                           |
| `expense_item_splits` | Phần tiền của từng người trên từng món              |
| `expense_receipts`    | Metadata ảnh bill và kết quả OCR                    |
| `settlements`         | Giao dịch trả nợ giữa hai thành viên                |
| `settlement_receipts` | Bằng chứng thanh toán                               |
| `activity_logs`       | Nhật ký thay đổi trong phòng                        |

## 6. Luồng đơn nháp và chia theo món

```text
Tạo hóa đơn
  -> lưu expenses.status = draft
  -> thêm một hoặc nhiều expense_items
  -> chọn người cho từng item
  -> lưu expense_item_splits
  -> kiểm tra tổng các món và phần chia
  -> post hóa đơn
  -> expenses.status = posted
  -> số dư và báo cáo bắt đầu tính hóa đơn
```

Đơn nháp đã được lưu trong PostgreSQL, không phải chỉ nằm ở trình duyệt. Danh sách có thể
lọc theo trạng thái `draft`, `posted`, `cancelled`. Hóa đơn bị hủy không được tính vào
báo cáo/công nợ.

Mỗi hóa đơn có nhiều dòng trong `expense_items`. Mỗi dòng lại có nhiều
`expense_item_splits`, vì vậy hai món trong cùng một bill có thể chia cho hai nhóm người
khác nhau.

## 7. Luồng PaddleOCR

```text
Chọn ảnh
  -> tạo/lưu đơn nháp
  -> upload ảnh vào bucket private receipts
  -> tạo expense_receipts với not_requested
  -> gọi endpoint /ocr
  -> pending -> processing
  -> PaddleOCR đọc ảnh trong threadpool
  -> completed hoặc failed
  -> lưu dữ liệu có cấu trúc vào ocr_data
  -> người dùng sửa và chọn các gợi ý
  -> tạo expense_items
```

OCR không tự đăng hóa đơn và không tự ghi nợ. Đây là chủ ý an toàn: người dùng phải xem
lại tên món, số lượng, đơn giá và người được chia.

Các model hiện dùng:

- Detection: `PP-OCRv5_mobile_det`
- Recognition: `latin_PP-OCRv5_mobile_rec`
- Device: CPU
- MKL-DNN: tắt mặc định để ổn định trên Windows

## 8. Luồng báo cáo

Backend chỉ lấy hóa đơn `posted` trong khoảng ngày được chọn. Service tổng hợp:

- tổng chi;
- số hóa đơn;
- trung bình mỗi hóa đơn;
- chi theo ngày;
- chi theo danh mục;
- chi theo người trả;
- chi theo thành viên;
- danh sách hóa đơn chi tiết.

Frontend vẽ biểu đồ từ response. Endpoint export dùng cùng dữ liệu và
`xlsxwriter` để tạo Excel, do đó số liệu trên màn hình và trong tệp xuất dùng chung nguồn.

## 9. Ranh giới bảo mật

- Publishable key được phép ở frontend.
- Service-role key và database password chỉ ở backend.
- Backend xác thực JWT trước mọi endpoint nghiệp vụ.
- Service kiểm tra người dùng có phải thành viên phòng và có đúng vai trò hay không.
- Bucket `receipts` là private; backend cấp signed URL ngắn hạn để xem ảnh.
- Không commit `.env`, model cache, ảnh upload, `.venv`, `node_modules` hoặc `.next`.
