# Cài đặt và vận hành

## 1. Chuẩn bị Supabase

Tạo một project Supabase rồi lấy các giá trị sau:

- Project URL.
- Publishable/anon key cho frontend.
- Service-role key cho backend.
- JWT secret hoặc JWKS tương ứng với cấu hình token.
- Chuỗi kết nối PostgreSQL.

Nếu mạng không hỗ trợ IPv6, mở **Connect > Transaction Pooler** trong Supabase và dùng
host pooler cổng `6543`.

## 2. Biến môi trường

### Backend

File `backend/.env`:

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

### Frontend

File `frontend/.env`:

```dotenv
NEXT_PUBLIC_API_ENDPOINT=http://127.0.0.1:8000
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Mọi biến bắt đầu bằng `NEXT_PUBLIC_` có thể xuất hiện trong bundle browser. Tuyệt đối
không đặt service-role key hoặc database password ở frontend.

## 3. Tạo database

Từ thư mục backend:

```powershell
python -m alembic upgrade head
python -m alembic current
```

Migration đầu tạo các enum, bảng và index. Migration tiếp theo tạo bucket Storage private
`receipts` với:

- loại ảnh: JPEG, PNG, WebP;
- dung lượng tối đa: 10 MB;
- public access: tắt.

Không sửa migration đã chạy trên Supabase. Khi đổi schema, tạo migration mới.

## 4. Chạy backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
```

Swagger chỉ bật khi `ENVIRONMENT` là `local`, `development` hoặc `staging`.

## 5. Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Nếu đổi biến môi trường, dừng và chạy lại Next.js. Các biến `NEXT_PUBLIC_` được đọc khi
build/chạy ứng dụng.

## 6. PaddleOCR

PaddleOCR được khởi tạo lazy, chỉ khi có yêu cầu scan đầu tiên. Điều này giúp backend
khởi động nhanh nhưng lần scan đầu có thể chậm vì tải model và warm-up.

Luồng kiểm tra:

1. Đăng nhập và chọn một phòng.
2. Tạo khoản chi mới.
3. Chọn ảnh bill rõ nét, chụp thẳng, đủ sáng.
4. Lưu nháp để ảnh được upload.
5. Chờ trạng thái `processing`.
6. Sửa tên món/số tiền OCR đọc sai.
7. Chọn người cho từng món rồi xác nhận hóa đơn.

Khi OCR lỗi:

- kiểm tra backend còn chạy;
- xem log Uvicorn;
- xác nhận `OCR_ENABLED=true`;
- kiểm tra máy có đủ RAM;
- thử ảnh JPEG/PNG/WebP dưới 10 MB;
- giữ `OCR_ENABLE_MKLDNN=false` trên Windows nếu gặp lỗi oneDNN;
- xác nhận máy có Internet ở lần tải model đầu.

PaddleOCR chạy trên backend, không chạy trên Vercel/Netlify Functions. Không tự động ghi
nợ từ dữ liệu OCR chưa được người dùng duyệt.

## 7. Dùng trong phòng với Tailscale

Mô hình đề xuất:

```text
Máy luôn bật trong phòng
  ├── Next.js :3000
  ├── FastAPI :8000
  └── Tailscale Serve (HTTPS riêng)
         |
         └── Điện thoại thành viên đã tham gia tailnet

Supabase vẫn nằm trên cloud
```

Các bước vận hành:

1. Cài Tailscale trên máy chạy BillMates và đăng nhập.
2. Cài Tailscale trên từng điện thoại, mời đúng tài khoản vào tailnet.
3. Bật MagicDNS trong Tailscale.
4. Dùng `tailscale serve` để reverse proxy ứng dụng qua HTTPS.
5. Đặt `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_API_ENDPOINT` và `FRONTEND_URL` theo hostname
   HTTPS của máy trong tailnet.
6. Build/chạy lại frontend và backend sau khi đổi biến môi trường.
7. Kiểm tra đăng nhập, upload ảnh và OCR từ một điện thoại dùng 4G để chắc chắn truy cập
   đi qua Tailscale.

Không dùng Funnel cho nhu cầu trong phòng vì Funnel công khai service ra Internet. Chỉ
người có quyền vào tailnet mới nên truy cập ứng dụng.

Lưu ý:

- Máy chủ tắt hoặc sleep thì web và OCR không truy cập được.
- Cần cấu hình Windows không sleep khi cắm điện.
- Nên tự khởi động frontend/backend sau khi máy reboot.
- Service-role key vẫn phải ở máy chủ, không chia sẻ cho thành viên.
- Nếu frontend và backend dùng hai origin khác nhau, `FRONTEND_URL` phải đúng origin
  frontend để CORS cho phép.

## 8. Backup và khôi phục

Dữ liệu nghiệp vụ nằm trong Supabase nên cần bật/chọn phương án backup phù hợp với gói
Supabase. Ảnh nằm trong Storage và cần backup riêng nếu hóa đơn quan trọng.

Trước khi chạy migration production:

1. kiểm tra `python -m alembic current`;
2. xem nội dung migration sắp chạy;
3. backup database;
4. chạy `python -m alembic upgrade head`;
5. kiểm tra health endpoint và một luồng tạo đơn nháp.

## 9. Các lệnh kiểm tra

```powershell
# Backend
cd backend
python -m pytest
python -m ruff check src tests

# Frontend
cd ..\frontend
npm run typecheck
npm run lint
npm test
npm run build
```

## 10. Sự cố thường gặp

| Hiện tượng                                | Nguyên nhân thường gặp                          | Cách kiểm tra                                    |
| ----------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Frontend báo biến môi trường không hợp lệ | Thiếu một biến `NEXT_PUBLIC_`                   | Xem `frontend/lib/config.ts`, restart dev server |
| API trả 401                               | JWT hết hạn hoặc cấu hình Supabase lệch project | Đăng nhập lại, kiểm tra URL/audience/JWT         |
| API không kết nối database                | Sai pooler host/password/driver                 | Kiểm tra `DATABASE_URL`, chạy `alembic current`  |
| Trình duyệt báo CORS                      | `FRONTEND_URL` không đúng origin                | Cập nhật backend `.env`, restart Uvicorn         |
| Ảnh upload lỗi                            | Sai service-role key, loại file hoặc quá 10 MB  | Kiểm tra log backend và bucket `receipts`        |
| OCR đứng lâu ở lần đầu                    | Đang tải/warm-up model                          | Theo dõi log và chờ model hoàn tất               |
| OCR lỗi trên Windows                      | oneDNN/MKL-DNN không tương thích                | Giữ `OCR_ENABLE_MKLDNN=false`                    |
| Điện thoại không mở được app              | Chưa vào tailnet hoặc máy chủ sleep             | Kiểm tra Tailscale và trạng thái máy chủ         |
