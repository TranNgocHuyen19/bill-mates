# Danh sách API

Base URL local: `http://127.0.0.1:8000/api/v1`

Trừ health check, các endpoint nghiệp vụ cần header:

```http
Authorization: Bearer <supabase_access_token>
```

Swagger tại `http://127.0.0.1:8000/docs` là tài liệu request/response chính xác nhất theo
source đang chạy.

## Health và xác thực

| Method | Path       | Mục đích                                   |
| ------ | ---------- | ------------------------------------------ |
| `GET`  | `/health`  | Kiểm tra API và database                   |
| `GET`  | `/auth/me` | Kiểm tra JWT và trả người dùng đã xác thực |

## Hồ sơ

| Method  | Path                   | Mục đích                        |
| ------- | ---------------------- | ------------------------------- |
| `GET`   | `/me`                  | Lấy hoặc đồng bộ hồ sơ hiện tại |
| `PATCH` | `/me`                  | Sửa hồ sơ                       |
| `GET`   | `/me/payment-accounts` | Danh sách tài khoản thanh toán  |
| `POST`  | `/me/payment-accounts` | Tạo tài khoản thanh toán        |

## Phòng, thành viên và danh mục

| Method   | Path                                        | Mục đích                      |
| -------- | ------------------------------------------- | ----------------------------- |
| `GET`    | `/rooms`                                    | Danh sách phòng đang tham gia |
| `POST`   | `/rooms`                                    | Tạo phòng                     |
| `GET`    | `/rooms/{room_id}`                          | Chi tiết phòng                |
| `PATCH`  | `/rooms/{room_id}`                          | Sửa phòng                     |
| `POST`   | `/rooms/{room_id}/archive`                  | Lưu trữ phòng                 |
| `GET`    | `/rooms/{room_id}/members`                  | Danh sách thành viên          |
| `POST`   | `/rooms/{room_id}/invites`                  | Tạo lời mời                   |
| `POST`   | `/invites/{token}/join`                     | Tham gia bằng token           |
| `PATCH`  | `/rooms/{room_id}/members/{member_id}/role` | Đổi vai trò                   |
| `POST`   | `/rooms/{room_id}/leave`                    | Rời phòng                     |
| `DELETE` | `/rooms/{room_id}/members/{member_id}`      | Xóa thành viên                |
| `GET`    | `/rooms/{room_id}/categories`               | Danh sách danh mục            |
| `POST`   | `/rooms/{room_id}/categories`               | Tạo danh mục                  |
| `PATCH`  | `/rooms/{room_id}/categories/{category_id}` | Sửa danh mục                  |

## Khoản chi, món và phần chia

| Method   | Path                              | Mục đích                                      |
| -------- | --------------------------------- | --------------------------------------------- |
| `GET`    | `/rooms/{room_id}/expenses`       | Danh sách hóa đơn; hỗ trợ status/limit/offset |
| `POST`   | `/rooms/{room_id}/expenses`       | Tạo đơn nháp                                  |
| `GET`    | `/expenses/{expense_id}`          | Chi tiết hóa đơn                              |
| `PATCH`  | `/expenses/{expense_id}`          | Sửa đơn nháp                                  |
| `POST`   | `/expenses/{expense_id}/items`    | Thêm món                                      |
| `DELETE` | `/expense-items/{item_id}`        | Xóa món                                       |
| `PUT`    | `/expense-items/{item_id}/splits` | Ghi lại phần chia của món                     |
| `POST`   | `/expenses/{expense_id}/post`     | Xác nhận/ghi nhận hóa đơn                     |
| `POST`   | `/expenses/{expense_id}/cancel`   | Hủy hóa đơn                                   |

Trạng thái hóa đơn:

- `draft`: đang làm, chưa tính công nợ/báo cáo;
- `posted`: đã xác nhận;
- `cancelled`: đã hủy.

## Ảnh bill và OCR

| Method | Path                                 | Mục đích                                |
| ------ | ------------------------------------ | --------------------------------------- |
| `POST` | `/expenses/{expense_id}/receipts`    | Upload ảnh bill                         |
| `GET`  | `/expenses/{expense_id}/receipts`    | Danh sách ảnh của hóa đơn               |
| `GET`  | `/expense-receipts/{receipt_id}`     | Chi tiết ảnh, trạng thái và kết quả OCR |
| `POST` | `/expense-receipts/{receipt_id}/ocr` | Chạy OCR; `force=true` để quét lại      |

Trạng thái OCR:

- `not_requested`;
- `pending`;
- `processing`;
- `completed`;
- `failed`.

## Công nợ và thanh toán

| Method | Path                                    | Mục đích                  |
| ------ | --------------------------------------- | ------------------------- |
| `GET`  | `/rooms/{room_id}/balances`             | Số dư và giao dịch tối ưu |
| `GET`  | `/rooms/{room_id}/settlements`          | Danh sách thanh toán      |
| `POST` | `/rooms/{room_id}/settlements`          | Tạo thanh toán            |
| `POST` | `/settlements/{settlement_id}/confirm`  | Xác nhận đã nhận          |
| `POST` | `/settlements/{settlement_id}/reject`   | Từ chối thanh toán        |
| `POST` | `/settlements/{settlement_id}/cancel`   | Hủy thanh toán            |
| `POST` | `/settlements/{settlement_id}/receipts` | Upload bằng chứng         |

## Báo cáo và lịch sử

| Method | Path                              | Mục đích                                        |
| ------ | --------------------------------- | ----------------------------------------------- |
| `GET`  | `/rooms/{room_id}/reports`        | Báo cáo JSON theo `from_date`, `to_date`        |
| `GET`  | `/rooms/{room_id}/reports/export` | Xuất Excel cùng khoảng ngày                     |
| `GET`  | `/rooms/{room_id}/activity`       | Nhật ký; hỗ trợ action/entity_type/limit/offset |

## Định dạng lỗi

Backend trả lỗi thống nhất:

```json
{
  "code": "validation_error",
  "message": "Dữ liệu gửi lên không hợp lệ.",
  "details": [],
  "request_id": "uuid"
}
```

Header `x-request-id` cũng được trả về để dò log backend.
