# BillMates

BillMates là ứng dụng web mobile-first để quản lý chi tiêu phòng trọ: tạo khoản chi, lưu
đơn nháp, tách một hóa đơn thành nhiều món, chia từng món cho từng người, theo dõi công
nợ, xác nhận thanh toán, xem báo cáo và xuất Excel.

Ứng dụng dùng Supabase cho đăng nhập, PostgreSQL và lưu ảnh riêng tư. PaddleOCR chạy
trong backend để đọc bill; kết quả OCR luôn được người dùng kiểm tra, chỉnh sửa trước khi
đưa vào danh sách món và chia tiền.

## Tính năng hiện có

- Đăng ký, đăng nhập, quên mật khẩu và duy trì phiên bằng Supabase Auth.
- Tạo phòng, mời thành viên, phân quyền, rời phòng và lưu trữ phòng.
- Tạo khoản chi ở trạng thái nháp, sửa hoặc hủy trước khi ghi nhận.
- Một hóa đơn có nhiều `expense_items`; mỗi món có danh sách người và số tiền được chia
  riêng.
- Nhập tiền theo định dạng VND, có phím xóa nhanh và các mức nhập nhanh.
- Tải ảnh bill, chạy PaddleOCR, xem ảnh và chỉnh các món OCR đọc được.
- Tính số dư và tối ưu các giao dịch cần thanh toán giữa thành viên.
- Thanh toán bằng tiền mặt/chuyển khoản, đính kèm bằng chứng và tạo VietQR.
- Báo cáo theo thời gian, biểu đồ trực quan và xuất tệp `.xlsx`.
- Nhật ký hoạt động theo phòng.
- Giao diện mobile-first, hỗ trợ desktop, light mode và dark mode.

## Dữ liệu được lưu ở đâu?

| Dữ liệu                                               | Nơi lưu                 | Ghi chú                                                              |
| ----------------------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| Tài khoản và phiên đăng nhập                          | Supabase Auth           | Frontend đăng nhập trực tiếp bằng publishable key                    |
| Phòng, thành viên, khoản chi, món, phần chia, công nợ | Supabase PostgreSQL     | Backend truy cập qua SQLAlchemy và `DATABASE_URL`                    |
| Ảnh hóa đơn                                           | Supabase Storage        | Bucket private `receipts`, tối đa 10 MB                              |
| Kết quả OCR                                           | Bảng `expense_receipts` | Cột `ocr_status` và `ocr_data`                                       |
| Trạng thái UI đang làm dở                             | Trình duyệt             | Chỉ dùng tạm cho điều hướng; bản nháp chính vẫn nằm trong PostgreSQL |

`SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng trong backend. Không đưa khóa này vào frontend,
Git hoặc mã nguồn public.

## Kiến trúc

```text
Điện thoại / trình duyệt
        |
        | Supabase Auth
        v
Frontend Next.js 16
        |
        | Bearer JWT + JSON / multipart
        v
Backend FastAPI
   |        |          |
   |        |          +--> PaddleOCR chạy CPU trên máy backend
   |        +-------------> Supabase Storage (ảnh bill)
   +----------------------> Supabase PostgreSQL (dữ liệu nghiệp vụ)
```

```text
bill-mates/
├── backend/       FastAPI, SQLAlchemy, Alembic, PaddleOCR và test backend
├── frontend/      Next.js, React, TanStack Query và giao diện mobile-first
├── docs/          SRS, sơ đồ thiết kế và tài liệu đọc source
└── README.md      Điểm bắt đầu của dự án
```

Đọc [tổng quan tài liệu](docs/README.md), [kiến trúc và luồng dữ liệu](docs/ARCHITECTURE.md)
hoặc [hướng dẫn từng thư mục và file](docs/FILE_GUIDE.md) để hiểu source nhanh hơn.

## Yêu cầu

- Node.js 20 trở lên.
- Python 3.12 trở lên.
- Một project Supabase.
- Windows, Linux hoặc macOS; PaddleOCR hiện được cấu hình chạy CPU.

## Cấu hình backend

Tạo `backend/.env`:

```dotenv
PROJECT_NAME=BillMates
API_V1_STR=/api/v1
ENVIRONMENT=local
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql+psycopg://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_JWT_SECRET=YOUR_JWT_SECRET
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_JWT_AUDIENCE=authenticated

OCR_ENABLED=true
OCR_LANGUAGE=vi
OCR_VERSION=PP-OCRv5
OCR_DEVICE=cpu
OCR_CPU_THREADS=4
OCR_ENABLE_MKLDNN=false
OCR_TEXT_DETECTION_MODEL=PP-OCRv5_mobile_det
OCR_TEXT_RECOGNITION_MODEL=latin_PP-OCRv5_mobile_rec
```

Với Supabase qua IPv4, nên lấy Transaction Pooler trong trang **Connect** và dùng driver
`postgresql+psycopg://`. Không commit file `.env`.

## Cấu hình frontend

Tạo `frontend/.env`:

```dotenv
NEXT_PUBLIC_API_ENDPOINT=http://127.0.0.1:8000
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Frontend chỉ chứa publishable key. Không sử dụng service-role key ở đây.

## Cài đặt và chạy local

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m alembic upgrade head
python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend, trong một cửa sổ terminal khác:

```powershell
cd frontend
npm install
npm run dev
```

Mở:

- Ứng dụng: [http://localhost:3000](http://localhost:3000)
- Swagger API: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- OpenAPI JSON: [http://127.0.0.1:8000/api/v1/openapi.json](http://127.0.0.1:8000/api/v1/openapi.json)

Lần quét bill đầu tiên có thể lâu hơn vì PaddleOCR tải và khởi tạo model. Backend đang
dùng `PP-OCRv5_mobile_det` và `latin_PP-OCRv5_mobile_rec`.

## Kiểm tra source

Backend:

```powershell
cd backend
python -m pytest
python -m ruff check src tests
```

Frontend:

```powershell
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
```

## Dùng trong phòng qua Tailscale

Phương án tiết kiệm nhất là để frontend và backend chạy trên một máy luôn bật, sau đó cho
các điện thoại trong phòng kết nối cùng tailnet:

1. Cài Tailscale trên máy chủ và điện thoại của từng thành viên.
2. Chỉ mời đúng thành viên phòng vào tailnet.
3. Dùng Tailscale Serve để cấp HTTPS cho ứng dụng nội bộ.
4. Cấu hình URL frontend/backend theo tên MagicDNS hoặc địa chỉ HTTPS do Tailscale cấp.
5. Không bật Tailscale Funnel nếu không muốn công khai ứng dụng ra Internet.

Máy chạy backend phải còn bật thì PaddleOCR mới hoạt động. Supabase vẫn hoạt động độc lập
trên cloud. Xem hướng dẫn chi tiết tại
[cài đặt và vận hành](docs/SETUP_AND_OPERATIONS.md).

## Tài liệu

- [Mục lục tài liệu](docs/README.md)
- [Kiến trúc và luồng dữ liệu](docs/ARCHITECTURE.md)
- [Hướng dẫn đọc các file](docs/FILE_GUIDE.md)
- [Cài đặt, Supabase, OCR và Tailscale](docs/SETUP_AND_OPERATIONS.md)
- [Danh sách API](docs/API_REFERENCE.md)
- [SRS gốc](docs/SRS_Room_Expense_Manager_v1.0.docx)
