# Cài đặt và vận hành local

## 1. Mô hình triển khai

BillMates chạy hoàn toàn trên máy Windows:

| Thành phần | Cách chạy | Cổng local |
| --- | --- | --- |
| Next.js production | Node.js | `3000` |
| FastAPI + PaddleOCR | Python | `8000` |
| Supabase API (Kong) | Docker | `55421` |
| PostgreSQL | Docker | `55422` |
| Supabase Studio | Docker | `55423` |
| Mailpit | Docker | `55424` |

Các cổng Supabase dùng dải `5542x` vì Windows/Hyper-V có thể dành riêng dải mặc định
`54321-54324`. Người dùng không cần nhớ các cổng này: Tailscale Serve gom ứng dụng về
`https://msi.tail41bfb8.ts.net`.

```text
/                 -> http://127.0.0.1:3000
/api/*            -> http://127.0.0.1:8000/api/*
/auth/*           -> http://127.0.0.1:55421/auth/*
/storage/*        -> http://127.0.0.1:55421/storage/*
/rest/*           -> http://127.0.0.1:55421/rest/*
```

Không bật Tailscale Funnel. Studio, Mailpit và PostgreSQL không được gắn route Tailscale.

## 2. Chuẩn bị máy

1. Cài Docker Desktop và mở một lần để hoàn tất thiết lập WSL/Hyper-V.
2. Cài Tailscale, đăng nhập và bật MagicDNS.
3. Trong Tailscale Admin, cho phép HTTPS/Serve cho tailnet.
4. Cài Node.js 20+, Python 3.12+ và Git.
5. Nên đặt Windows không sleep khi đang cắm điện.

Kiểm tra:

```powershell
docker info
tailscale status
node --version
python --version
```

## 3. Cài dependency

Từ thư mục gốc:

```powershell
npm install --prefix infra
npm install --prefix frontend

python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install --upgrade pip
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
```

`infra/package-lock.json` giữ Supabase CLI ở đúng phiên bản đã kiểm thử. Không cần cài
`supabase` global.

## 4. Khởi động

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1
```

Nếu frontend đã được build và source không đổi:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1 -SkipBuild
```

Chỉ để chẩn đoán trên máy chủ khi tailnet chưa bật Serve:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1 -SkipBuild -SkipTailscale
```

Script thực hiện theo thứ tự:

1. bảo đảm Docker Desktop sẵn sàng;
2. chạy Supabase local tối giản;
3. đọc key local trong bộ nhớ và tạo file env bị ignore;
4. chạy Alembic vào PostgreSQL local;
5. build frontend khi cần;
6. chạy backend với `SelectorEventLoop` tương thích psycopg trên Windows;
7. chạy Next.js production;
8. cấu hình và kiểm tra Tailscale Serve.

Nếu health check thất bại, script dừng frontend/backend vừa tạo nhưng giữ Supabase và dữ liệu để
điều tra.

## 5. Biến môi trường

`scripts/start-local.ps1` tự tạo:

- `backend/.env.local`;
- `frontend/.env.local`.

Hai file đều bị Git ignore. `.env.local` được ưu tiên hơn `.env`, nên cấu hình cloud cũ (nếu có)
không bị ghi đè.

Backend local gồm:

```dotenv
FRONTEND_URL=https://msi.tail41bfb8.ts.net
DATABASE_URL=postgresql+psycopg://...@127.0.0.1:55422/postgres
SUPABASE_URL=https://msi.tail41bfb8.ts.net
SUPABASE_INTERNAL_URL=http://127.0.0.1:55421
SUPABASE_JWT_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Frontend chỉ nhận URL và publishable key:

```dotenv
NEXT_PUBLIC_API_ENDPOINT=https://msi.tail41bfb8.ts.net
NEXT_PUBLIC_URL=https://msi.tail41bfb8.ts.net
NEXT_PUBLIC_SUPABASE_URL=https://msi.tail41bfb8.ts.net
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Không đưa database password, JWT secret hoặc service-role key vào biến `NEXT_PUBLIC_*`.

## 6. Database và Storage

Alembic tạo schema nghiệp vụ và bucket private `receipts`:

- tối đa 10 MiB;
- chỉ nhận JPEG, PNG và WebP;
- không public;
- metadata OCR nằm trong bảng `expense_receipts`.

Kiểm tra revision:

```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic current
```

Supabase Studio chỉ mở trên máy chủ tại
[http://127.0.0.1:55423](http://127.0.0.1:55423).

## 7. PaddleOCR

PaddleOCR khởi tạo lazy khi scan bill lần đầu. Lần đầu có thể mất vài phút để tải model và
warm-up CPU.

Luồng sử dụng:

1. đăng nhập và tạo/chọn phòng;
2. tạo khoản chi ở trạng thái nháp;
3. tải ảnh JPEG/PNG/WebP dưới 10 MiB;
4. lưu nháp để ảnh vào Storage;
5. chạy OCR và chờ `completed`;
6. kiểm tra, sửa merchant, tổng tiền và từng món;
7. chọn người cho từng món rồi mới ghi nhận.

OCR không tự động ghi công nợ khi người dùng chưa duyệt. Trên Windows giữ
`OCR_ENABLE_MKLDNN=false` nếu gặp lỗi oneDNN.

## 8. Trạng thái và log

```powershell
powershell -ExecutionPolicy Bypass -File scripts\status-local.ps1
```

PID và log nằm trong `.local/`, bị Git ignore:

```text
.local/
├── backend.pid
├── frontend.pid
└── logs/
    ├── backend.log
    ├── backend-error.log
    ├── frontend.log
    └── frontend-error.log
```

Không gửi file `.env.local` hoặc log có dữ liệu nhạy cảm cho người khác.

## 9. Dừng và khởi động lại

Dừng toàn bộ, vẫn giữ database và ảnh:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\stop-local.ps1
```

Chỉ dừng app, giữ Supabase chạy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\stop-local.ps1 -KeepSupabase
```

Giữ cả cấu hình Tailscale Serve:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\stop-local.ps1 -KeepTailscale
```

Stop script dừng cả cây tiến trình Node/Python. Nó không dùng reset database, không xóa Docker
volume và không gọi `supabase stop --no-backup`.

## 10. Tự chạy khi đăng nhập Windows

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-startup-task.ps1
```

Script tạo một task tên `BillMates Local`, chạy ẩn khi tài khoản hiện tại đăng nhập. Chạy lại
installer sẽ cập nhật cùng task, không tạo task trùng.

Gỡ task nếu không muốn tự chạy:

```powershell
Unregister-ScheduledTask -TaskName "BillMates Local" -Confirm:$false
```

## 11. Backup

Supabase local giữ dữ liệu trong Docker volumes. Normal stop/start không xóa volume, nhưng đây
không thay thế backup.

Nên định kỳ:

- dump PostgreSQL bằng `pg_dump`;
- sao lưu object trong bucket `receipts`;
- giữ bản backup ngoài ổ đĩa máy chủ.

Tuyệt đối tránh khi chưa có backup:

```text
supabase db reset
supabase stop --no-backup
docker volume rm ...
docker compose down -v
```

## 12. Kiểm thử

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

Kiểm tra runtime:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
Invoke-WebRequest http://127.0.0.1:3000
tailscale serve status
```

Sau khi Serve bật, thử trên điện thoại dùng 4G:

1. bật Tailscale và mở `https://msi.tail41bfb8.ts.net`;
2. đăng ký/đăng nhập;
3. tạo phòng và một khoản chi nháp;
4. upload bill, chạy OCR và tải lại ảnh;
5. tắt Tailscale trên điện thoại và xác nhận URL không truy cập được.

## 13. Sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| `ports are not available` ở `54321-54324` | Windows dành riêng dải cổng | Giữ cấu hình `55421-55424` hiện tại |
| `Serve is not enabled on your tailnet` | Tailnet chưa cho phép Serve | Bật HTTPS/Serve trong Tailscale Admin |
| API health trả `database_unavailable` | Sai event loop hoặc DB chưa ready | Chạy bằng `python -m src.server`, xem Docker health |
| API trả 401 sau login | JWT issuer/JWKS không khớp | Giữ issuer public và `SUPABASE_INTERNAL_URL` trỏ Kong local |
| Upload ảnh lỗi | Sai key, MIME hoặc quá 10 MiB | Xem backend log và bucket `receipts` |
| OCR lần đầu lâu | Đang tải/warm-up model | Chờ vài phút và xem backend log |
| Điện thoại không mở app | Chưa vào tailnet, Serve tắt hoặc máy sleep | Kiểm tra Tailscale và trạng thái máy |
| Start báo cổng `3000/8000` bận | Một instance cũ còn chạy | Chạy `scripts\stop-local.ps1`, rồi start lại |
