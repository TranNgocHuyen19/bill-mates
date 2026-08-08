# 🚀 BillMates — Nền Tảng Quản Lý Chi Tiêu & Tối Ưu Công Nợ Nhóm Thông Minh

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12+-009688?style=for-the-badge&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Database-3ECF8E?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)

> **BillMates** là ứng dụng Web/PWA hiện đại giúp giải quyết triệt để sự ngại ngùng và phức tạp khi chia tiền nhà, điện nước, ăn uống cùng bạn cùng phòng, chuyến đi du lịch hoặc đồng nghiệp. Hệ thống tích hợp thuật toán tối ưu dòng tiền thông minh và quét hóa đơn AI tự động.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 🔐 1. Xác Thực & Bảo Mật (Supabase Auth)
- **Đăng ký & Đăng nhập:** Xác thực an toàn bằng Email & Mật khẩu qua JWT Bearer Token.
- **Quên & Đổi mật khẩu:** Gửi email liên kết khôi phục mật khẩu và cập nhật mật khẩu mới an toàn.
- **Bảo mật phiên làm việc:** Tự động quản lý Refresh Token và xóa session khi đăng xuất.

### 🏠 2. Quản Lý Phòng Trọ & Nhóm Chi Tiêu
- **Quản lý danh sách phòng:** Theo dõi tất cả các nhóm/phòng trọ bạn đang tham gia cùng bảng số dư thu/trả.
- **Tạo phòng trọ mới:** Khởi tạo nhóm chi tiêu mới chỉ trong vài giây.
- **Dashboard chi tiết phòng:** Theo dõi biến động chi tiêu nhóm, danh sách thành viên và hóa đơn phát sinh.
- **Mời bạn cùng phòng:** Tạo liên kết mời (Invite Link) cho bạn bè tham gia nhóm 1-touch.

### 🧾 3. Wizard Thêm Hóa Đơn & AI OCR Quét Bill
- **Quét hóa đơn bằng AI (OCR):** Tải ảnh bill (WinMart, Điện, Nước, Trà sữa...) để AI tự động trích xuất món ăn và số tiền.
- **Linh hoạt phương thức chia tiền:**
  - ⚖️ **Chia đều (Equal Split):** Tự động chia bằng nhau cho các thành viên chọn.
  - 🛒 **Chia theo món (Itemized Split):** Chọn chính xác ai ăn/dùng món nào trong hóa đơn.
  - 📊 **Chia theo tỷ lệ % (Percentage Split):** Phân chia theo phần trăm hoặc số ngày ở.
- **Xem trước phân rã nợ:** Bảng tính chi tiết nợ từng người trước khi lưu hóa đơn.

### 💳 4. Thuật Toán Tối Ưu Dòng Tiền (Minimizing Cash Flow Algorithm)
- **Bảng quản lý công nợ:** Phân loại rõ ràng *"Tiền bạn cần thu"* (kèm nút Nhắc nợ) và *"Tiền bạn cần trả"* (kèm nút Trả ngay).
- **Rút gọn giao dịch lặp lặp:** Thuật toán Python tự động gộp nợ lặp đi lặp lại nhiều lần giữa các thành viên thành số lượng giao dịch tối thiểu nhất.

### 📱 5. Thanh Toán VietQR & Giao Diện Mobile-First
- **Tạo mã VietQR tự động:** Điền tự động STK, Ngân hàng, Số tiền và Nội dung chuyển khoản chuẩn xác.
- **Giao diện Mobile-First:** 
  - **Sliding Bottom Sheet Menu:** Menu trượt dạng ngăn kéo iOS/Android khi bấm vào Avatar.
  - **Bottom Navigation Bar:** Thanh 4 tab cố định dưới đáy màn hình với nút **`+ Thêm mới`** nổi bật.
  - **Giao diện Sáng / Tối (Dark / Light Mode):** Tự động chuyển đổi theme mắt nhìn dễ chịu.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

Dự án được xây dựng theo kiến trúc tách biệt **Fullstack Decoupled**:

```
BillMates Project
├── 🎨 frontend/        -> Next.js 16 (App Router) + React 19 + TailwindCSS + TanStack Query
└── 🐍 backend/         -> FastAPI (Python 3.12+) + Domain-Driven Architecture + Supabase PostgREST
```

### Tech Stack Chi Tiết:
- **Frontend Framework:** Next.js 16 (Turbopack), React 19, TypeScript
- **Styling & UI:** TailwindCSS v4, Lucide Icons, Sonner Toast, Next Themes
- **State & Data Fetching:** TanStack Query v5 (React Query), `@supabase/ssr`
- **Backend Framework:** FastAPI (Python 3.12+), Pydantic v2, Uvicorn
- **Database & Auth:** Supabase Auth & PostgreSQL Database (PostgREST API / Async SQLAlchemy 2.0)

---

## 📁 Cấu Trúc Thư Mục Dự Án (Directory Structure)

```
d:/Project/bill-mates/
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

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy (Installation & Setup)

### Yêu cầu tiên quyết (Prerequisites)
- **Node.js** >= 20.x
- **Python** >= 3.12
- **Supabase Account** (Đã tạo Project trên Supabase Dashboard)

---

### 1. Khởi động Backend (FastAPI)

1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Tạo và kích hoạt môi trường ảo Python:
   ```bash
   python -m venv .venv
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   ```
3. Cài đặt các gói phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```
4. Tạo file `backend/.env` và điền cấu hình Supabase:
   ```env
   DATABASE_URL="postgresql+asyncpg://postgres:your_password@db.your_project.supabase.co:5432/postgres"
   SUPABASE_URL="https://your_project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
   SUPABASE_JWT_SECRET="your_supabase_jwt_secret"
   ```
5. Khởi chạy Uvicorn Dev Server:
   ```bash
   python -m uvicorn src.main:app --reload
   ```
   👉 Backend API sẽ chạy tại: **`http://localhost:8000`** (API Docs tại `http://localhost:8000/docs`).

---

### 2. Khởi động Frontend (Next.js)

1. Di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Tạo file `frontend/.env`:
   ```env
   NEXT_PUBLIC_API_ENDPOINT=http://localhost:8000
   NEXT_PUBLIC_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL="https://your_project.supabase.co"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"
   ```
4. Khởi chạy Next.js Dev Server:
   ```bash
   npm run dev
   ```
   👉 Ứng dụng Web sẽ chạy tại: **`http://localhost:3000`**

---

## 📝 Giấy Phép & Bản Quyền (License)

Dự án được phát triển và duy trì bởi **Trần Ngọc Huyên** © 2026.  
Phát hành theo giấy phép [MIT License](LICENSE).
