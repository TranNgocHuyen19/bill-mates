# BillMates — Nền Tảng Quản Lý Chi Tiêu & Tối Ưu Công Nợ Nhóm

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12+-009688?style=flat-square&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Database-3ECF8E?style=flat-square&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)

BillMates là ứng dụng web giúp quản lý chi tiêu và tự động hóa tính toán công nợ cho các nhóm bạn cùng phòng, chuyến đi du lịch hoặc đồng nghiệp. Hệ thống tích hợp thuật toán tối ưu hóa dòng tiền và hỗ trợ trích xuất thông tin hóa đơn bằng AI OCR.

---

## 1. Tính Năng Chính

### Xác Thực & Bảo Mật (Supabase Auth)
- Đăng ký và đăng nhập tài khoản bằng Email & Mật khẩu với JWT Bearer Token.
- Quên mật khẩu và đặt lại mật khẩu qua liên kết xác thực email.
- Quản lý phiên đăng nhập và xóa token an toàn khi đăng xuất.

### Quản Lý Phòng Trọ & Nhóm Chi Tiêu
- Xem danh sách các nhóm/phòng trọ đang tham gia cùng số dư thu/trả.
- Khởi tạo phòng trọ hoặc nhóm chi tiêu mới.
- Dashboard theo dõi chi tiết biến động chi tiêu, danh sách thành viên và hóa đơn.
- Tạo liên kết mời thành viên tham gia nhóm.

### Hóa Đơn & AI OCR Quét Bill
- Tải ảnh hóa đơn để AI tự động trích xuất món ăn và số tiền.
- Phương thức chia tiền linh hoạt:
  - Chia đều (Equal Split): Chia bằng nhau cho các thành viên chọn.
  - Chia theo món (Itemized Split): Phân chia theo chính xác từng món ăn/dịch vụ.
  - Chia theo tỷ lệ % (Percentage Split): Phân chia theo phần trăm hoặc số ngày ở.
- Bảng xem trước chi tiết nợ từng người trước khi lưu hóa đơn.

### Thuật Toán Tối Ưu Dòng Tiền (Minimizing Cash Flow)
- Quản lý công nợ phân loại theo Tiền cần thu (kèm nút Nhắc nợ) và Tiền cần trả (kèm nút Trả ngay).
- Thuật toán tự động gộp các giao dịch lặp đi lặp lại giữa các thành viên thành số lượng giao dịch tối thiểu.

### Thanh Toán VietQR & Giao Diện Mobile-First
- Tự động tạo mã VietQR chứa số tài khoản, ngân hàng, số tiền và nội dung chuyển khoản.
- Giao diện tối ưu di động với thanh Bottom Navigation cố định và Bottom Sheet Menu trượt mượt mà.
- Hỗ trợ chuyển đổi giao diện Sáng / Tối (Dark / Light Mode).

---

## 2. Kiến Trúc Hệ Thống

Dự án phát triển theo mô hình Fullstack Decoupled:

```
BillMates Project
├── frontend/        -> Next.js 16 (App Router) + React 19 + TailwindCSS + TanStack Query
└── backend/         -> FastAPI (Python 3.12+) + Domain-Driven Architecture + Supabase PostgREST
```

### Công Nghệ Sử Dụng
- Frontend: Next.js 16 (Turbopack), React 19, TypeScript, TailwindCSS v4, TanStack Query v5, Sonner Toast, Lucide Icons.
- Backend: FastAPI (Python 3.12+), Pydantic v2, Uvicorn, Async SQLAlchemy 2.0.
- Cơ Sở Dữ Liệu & Auth: Supabase Auth & PostgreSQL Database (PostgREST API).

---

## 3. Cấu Trúc Thư Mục

```
bill-mates/
├── backend/
│   ├── src/
│   │   ├── auth/           # Module xác thực người dùng & token JWT
│   │   ├── users/          # Module quản lý thông tin tài khoản & ngân hàng
│   │   ├── rooms/          # Module phòng trọ & danh sách thành viên
│   │   ├── expenses/       # Module hóa đơn & quét bill AI OCR
│   │   ├── debts/          # Module công nợ & thuật toán tối ưu dòng tiền
│   │   ├── supabase.py     # Async Supabase Client CRUD
│   │   ├── config.py       # Cấu hình biến môi trường
│   │   ├── database.py     # Engine Async SQLAlchemy 2.0
│   │   └── main.py         # Root FastAPI application
│   └── .env                # Biến môi trường Backend
├── frontend/
│   ├── app/                # Next.js App Router (pages & layouts)
│   │   ├── auth/           # Đăng nhập, Đăng ký, Quên mật khẩu
│   │   ├── rooms/          # Danh sách phòng & Dashboard phòng
│   │   ├── expenses/       # Wizard Thêm hóa đơn & Chia tiền
│   │   ├── debts/          # Quản lý công nợ & Thanh toán VietQR
│   │   └── profile/        # Tài khoản & Cài đặt giao diện
│   ├── components/         # Reusable UI components (Navbar, BottomNav, Toaster)
│   ├── constants/          # Đường dẫn ứng dụng (PATHS)
│   ├── features/           # Auth queries, mutations & API integration
│   └── lib/                # Supabase client helpers & toast notifications
└── README.md
```

---

## 4. Hướng Dẫn Khởi Chạy

### Yêu Cầu
- Node.js >= 20.x
- Python >= 3.12
- Tài khoản Supabase

### Khởi Động Backend (FastAPI)

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi tạo dữ liệu / Chạy Database Migration
alembic upgrade head

# Khởi chạy server FastAPI
python -m uvicorn src.main:app --reload --port 8000
```
Backend API chạy tại: `http://localhost:8000` (API Docs tại `http://localhost:8000/docs`).

> **Lưu ý Cấu Hình Supabase (Windows & Connection Pooler)**:
> - Sử dụng driver `postgresql+psycopg://` trong `DATABASE_URL` của `backend/.env`.
> - Nếu sử dụng mạng IPv4, hãy chọn **Transaction Pooler** (`aws-1-...pooler.supabase.com:6543`) trong Supabase Connect settings.

### PaddleOCR quét hóa đơn

- Backend dùng PaddleOCR `3.7.0` và PaddlePaddle CPU `3.3.1`.
- Migration tạo bucket Supabase Storage private `receipts`, giới hạn 10 MB và chỉ nhận JPEG, PNG, WebP.
- Model `PP-OCRv5_mobile_det` và `latin_PP-OCRv5_mobile_rec` được tải vào cache ở lần quét đầu tiên.
- Có thể tắt OCR bằng `OCR_ENABLED=false` hoặc đổi thiết bị bằng `OCR_DEVICE`.

PaddleOCR không phù hợp với Vercel/Netlify Functions do package, RAM và thời gian cold start lớn. Khi deploy nên dùng backend container chạy lâu dài và giữ được cache model; các gói free bị sleep hoặc không có persistent disk có thể phải tải lại model sau mỗi cold start.

### Khởi Động Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
Ứng dụng Web chạy tại: `http://localhost:3000`.

---

## 5. Giấy Phép

Dự án được phát triển bởi Trần Ngọc Huyên © 2026. Phát hành theo giấy phép MIT.
