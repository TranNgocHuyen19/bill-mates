# BillMates

BillMates là ứng dụng web mobile-first để quản lý chi tiêu phòng trọ: lưu đơn nháp, tách một
hóa đơn thành nhiều món, chia từng món cho từng người, theo dõi công nợ, quét bill bằng
PaddleOCR, xem báo cáo trực quan và xuất Excel.

Phiên bản triển khai hiện tại chạy hoàn toàn trên một máy Windows. Dữ liệu không phụ thuộc
Supabase Cloud:

- PostgreSQL, Auth và Storage chạy bằng Supabase CLI + Docker Desktop.
- FastAPI và PaddleOCR chạy trực tiếp trên Python của máy.
- Next.js chạy production trên Node.js.
- Tailscale Serve cung cấp một địa chỉ HTTPS riêng cho các thành viên cùng tailnet.

Khi máy chủ tắt hoặc sleep, BillMates sẽ không truy cập được. Đây là chủ đích phù hợp với nhu
cầu dùng trong một phòng trọ.

## Tính năng

- Đăng ký, đăng nhập, quên mật khẩu và duy trì phiên bằng Supabase Auth local.
- Tạo phòng, mời thành viên, phân quyền, rời phòng và lưu trữ phòng.
- Lưu khoản chi ở trạng thái nháp trước khi ghi nhận.
- Một hóa đơn có nhiều `expense_items`; mỗi món được chia riêng theo thành viên.
- Nhập tiền định dạng VND, phím xóa nhanh và mức nhập nhanh.
- Upload ảnh bill vào bucket private, quét bằng PaddleOCR và chỉnh kết quả trước khi chia.
- Tính số dư, tối ưu giao dịch thanh toán và lưu bằng chứng thanh toán.
- Báo cáo theo thời gian, biểu đồ trực quan và xuất `.xlsx`.
- Giao diện mobile-first, hỗ trợ desktop, light mode và dark mode.

## Dữ liệu nằm ở đâu?

| Dữ liệu | Nơi lưu trên máy chủ |
| --- | --- |
| Tài khoản và phiên | Supabase Auth local trong Docker volume |
| Phòng, thành viên, khoản chi, món, phần chia, công nợ | PostgreSQL local trong Docker volume |
| Ảnh bill và bằng chứng | Supabase Storage local, bucket private `receipts` |
| Kết quả OCR | Cột `ocr_status` và `ocr_data` của PostgreSQL |
| Model PaddleOCR | Cache local của tài khoản Windows |

Các file `backend/.env.local` và `frontend/.env.local` được script tạo tự động và đã bị Git bỏ
qua. File `.env` cũ không bị ghi đè.

## Kiến trúc local

```text
Điện thoại thành viên (đã vào tailnet)
                  |
                  | HTTPS riêng
                  v
      https://msi.tail41bfb8.ts.net
          |        |        |
          |        |        +-- /auth/v1, /storage/v1, /rest/v1
          |        |                   -> Supabase local :55421
          |        +----------- /api -> FastAPI :8000 -> PaddleOCR
          +------------------------- / -> Next.js :3000
                                             |
                                             +-> PostgreSQL :55422
```

Tailscale Funnel không được dùng, nên ứng dụng không công khai ra Internet. Studio, Mailpit và
PostgreSQL chỉ lắng nghe trên máy chủ.

## Yêu cầu máy chủ

- Windows 10/11.
- Docker Desktop.
- Tailscale đã đăng nhập; tailnet cho phép Tailscale Serve.
- Node.js 20 trở lên.
- Python 3.12 và môi trường `backend/.venv`.
- Khoảng 8 GB RAM trống khi chạy đồng thời Docker, Next.js và PaddleOCR.

Supabase CLI được pin ở phiên bản `2.113.0` trong `infra/package.json`; không cần cài global.

## Cài lần đầu

```powershell
git clone <repository-url>
cd bill-mates

npm install --prefix infra
npm install --prefix frontend

python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt

powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1
```

Script sẽ:

1. kiểm tra và mở Docker Desktop;
2. chạy Auth, PostgreSQL, Storage, REST, Studio và Mailpit local;
3. tạo các `.env.local` bị Git ignore;
4. chạy `alembic upgrade head`;
5. build và chạy Next.js production;
6. chạy FastAPI + PaddleOCR;
7. cấu hình Tailscale Serve theo cùng một HTTPS origin.

Mở ứng dụng tại [https://msi.tail41bfb8.ts.net](https://msi.tail41bfb8.ts.net).

Các trang quản trị chỉ mở trên máy chủ:

- Supabase Studio: [http://127.0.0.1:55423](http://127.0.0.1:55423)
- Mailpit: [http://127.0.0.1:55424](http://127.0.0.1:55424)

## Vận hành hằng ngày

```powershell
# Khởi động; thêm -SkipBuild nếu source frontend không đổi
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1

# Xem trạng thái, route và log backend gần nhất
powershell -ExecutionPolicy Bypass -File scripts\status-local.ps1

# Dừng app và Supabase, giữ nguyên toàn bộ dữ liệu
powershell -ExecutionPolicy Bypass -File scripts\stop-local.ps1
```

Muốn tự chạy sau khi đăng nhập Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-startup-task.ps1
```

Task Scheduler không chứa key. Các key local chỉ nằm trong file env bị ignore. Không dùng
`supabase stop --no-backup`, `supabase db reset`, `docker volume rm` hoặc `docker compose down -v`
nếu muốn giữ dữ liệu.

## Kiểm tra source

```powershell
# Backend
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check src tests

# Frontend
cd ..\frontend
npm run typecheck
npm run lint
npm test
npm run build
```

## Cấu trúc chính

```text
bill-mates/
├── backend/       FastAPI, SQLAlchemy, Alembic và PaddleOCR
├── frontend/      Next.js, React, TanStack Query và UI mobile-first
├── infra/         Supabase CLI được pin phiên bản
├── scripts/       Start, stop, status, Tailscale và startup task
├── supabase/      Cấu hình Supabase local
├── docs/          SRS, kiến trúc, API và hướng dẫn đọc source
└── .local/        PID và log local, bị Git ignore
```

Đọc tiếp:

- [Cài đặt và vận hành chi tiết](docs/SETUP_AND_OPERATIONS.md)
- [Kiến trúc và luồng dữ liệu](docs/ARCHITECTURE.md)
- [Hướng dẫn các thư mục và file](docs/FILE_GUIDE.md)
- [Danh sách API](docs/API_REFERENCE.md)
- [SRS gốc](docs/SRS_Room_Expense_Manager_v1.0.docx)
