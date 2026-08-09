from datetime import UTC, date, datetime
from decimal import Decimal
from io import BytesIO
from typing import Any

import xlsxwriter

from src.reports.schemas import RoomReport

MONEY_FORMAT = "#,##0.00 [$₫-vi-VN];[Red]-#,##0.00 [$₫-vi-VN]"


def _excel_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "value"):
        return value.value
    return value


def _write_table(
    workbook: xlsxwriter.Workbook,
    sheet_name: str,
    headers: list[str],
    rows: list[list[Any]],
    *,
    money_columns: set[int] | None = None,
    date_columns: set[int] | None = None,
    datetime_columns: set[int] | None = None,
    money_rows: set[int] | None = None,
    date_rows: set[int] | None = None,
    datetime_rows: set[int] | None = None,
) -> None:
    worksheet = workbook.add_worksheet(sheet_name)
    header_format = workbook.add_format(
        {
            "bold": True,
            "font_color": "#ffffff",
            "bg_color": "#006c49",
            "border": 0,
            "align": "center",
            "valign": "vcenter",
        }
    )
    money_format = workbook.add_format({"num_format": MONEY_FORMAT})
    date_format = workbook.add_format({"num_format": "dd/mm/yyyy"})
    datetime_format = workbook.add_format({"num_format": "dd/mm/yyyy hh:mm"})
    worksheet.freeze_panes(1, 0)
    worksheet.set_row(0, 24)

    for column, header in enumerate(headers):
        worksheet.write_string(0, column, header, header_format)

    for row_index, row in enumerate(rows, start=1):
        for column, raw_value in enumerate(row):
            value = _excel_value(raw_value)
            if value is None:
                worksheet.write_blank(row_index, column, None)
            elif (
                datetime_columns
                and column in datetime_columns
                and (datetime_rows is None or row_index - 1 in datetime_rows)
                and isinstance(value, datetime)
            ):
                if value.tzinfo is not None:
                    value = value.astimezone(UTC).replace(tzinfo=None)
                worksheet.write_datetime(row_index, column, value, datetime_format)
            elif (
                date_columns
                and column in date_columns
                and (date_rows is None or row_index - 1 in date_rows)
                and isinstance(value, date)
            ):
                worksheet.write_datetime(row_index, column, value, date_format)
            elif (
                money_columns
                and column in money_columns
                and (money_rows is None or row_index - 1 in money_rows)
                and isinstance(value, (int, float))
            ):
                worksheet.write_number(row_index, column, value, money_format)
            elif isinstance(value, (int, float)):
                worksheet.write_number(row_index, column, value)
            else:
                worksheet.write_string(row_index, column, str(value))

    last_row = len(rows)
    worksheet.autofilter(0, 0, last_row, len(headers) - 1)
    for column, header in enumerate(headers):
        values = [str(_excel_value(row[column]) or "") for row in rows]
        width = min(max([len(header), *(len(value) for value in values)]) + 2, 36)
        worksheet.set_column(column, column, width)


def build_report_workbook(report: RoomReport) -> bytes:
    output = BytesIO()
    workbook = xlsxwriter.Workbook(
        output,
        {
            "in_memory": True,
            "strings_to_formulas": False,
            "strings_to_urls": False,
        },
    )
    workbook.set_properties(
        {
            "title": f"Báo cáo chi tiêu - {report.room_name}",
            "subject": "Báo cáo chi tiêu phòng",
            "author": "Bill Mates",
        }
    )

    summary_rows = [
        ["Phòng", report.room_name],
        ["Mã phòng", str(report.room_id)],
        ["Từ ngày", report.from_date],
        ["Đến ngày", report.to_date],
        ["Múi giờ", report.timezone],
        ["Tạo lúc", report.generated_at],
        ["Số khoản chi", report.summary.posted_expense_count],
        ["Tổng chi tiêu", report.summary.total_expenses],
        ["Số thành viên", report.summary.member_count],
        ["Số thanh toán đã xác nhận", report.summary.confirmed_settlement_count],
        ["Tổng thanh toán đã xác nhận", report.summary.confirmed_settlement_amount],
    ]
    _write_table(
        workbook,
        "Summary",
        ["Chỉ số", "Giá trị"],
        summary_rows,
        money_columns={1},
        date_columns={1},
        datetime_columns={1},
        money_rows={7, 10},
        date_rows={2, 3},
        datetime_rows={5},
    )
    _write_table(
        workbook,
        "Expenses",
        [
            "Mã khoản chi",
            "Ngày",
            "Nội dung",
            "Mã người trả",
            "Người trả",
            "Số tiền",
            "Ghi chú",
            "Đăng lúc",
        ],
        [
            [
                row.expense_id,
                row.expense_date,
                row.title,
                row.payer_member_id,
                row.payer_name,
                row.total,
                row.note,
                row.posted_at,
            ]
            for row in report.expenses
        ],
        money_columns={5},
        date_columns={1},
        datetime_columns={7},
    )
    _write_table(
        workbook,
        "Items",
        [
            "Mã khoản chi",
            "Ngày",
            "Mã mục",
            "Thứ tự",
            "Tên mục",
            "Mã danh mục",
            "Danh mục",
            "Số lượng",
            "Đơn giá",
            "Thành tiền",
        ],
        [
            [
                row.expense_id,
                row.expense_date,
                row.item_id,
                row.position,
                row.name,
                row.category_id,
                row.category_name,
                row.quantity,
                row.unit_price,
                row.total,
            ]
            for row in report.items
        ],
        money_columns={8, 9},
        date_columns={1},
    )
    _write_table(
        workbook,
        "Splits",
        [
            "Mã khoản chi",
            "Mã mục",
            "Tên mục",
            "Mã thành viên",
            "Thành viên",
            "Cách chia",
            "Hệ số",
            "Số tiền phải trả",
        ],
        [
            [
                row.expense_id,
                row.item_id,
                row.item_name,
                row.member_id,
                row.member_name,
                row.split_method,
                row.share_value,
                row.amount_owed,
            ]
            for row in report.splits
        ],
        money_columns={7},
    )
    _write_table(
        workbook,
        "Balances",
        [
            "Mã thành viên",
            "Thành viên",
            "Đã trả",
            "Phải chịu",
            "Đã thanh toán",
            "Đã nhận",
            "Số dư",
        ],
        [
            [
                row.member_id,
                row.display_name,
                row.paid,
                row.owed,
                row.settlements_sent,
                row.settlements_received,
                row.balance,
            ]
            for row in report.members
        ],
        money_columns={2, 3, 4, 5, 6},
    )
    _write_table(
        workbook,
        "Settlements",
        [
            "Mã thanh toán",
            "Tạo lúc",
            "Xác nhận lúc",
            "Mã người gửi",
            "Người gửi",
            "Mã người nhận",
            "Người nhận",
            "Số tiền",
            "Phương thức",
            "Trạng thái",
            "Tham chiếu",
            "Ghi chú",
        ],
        [
            [
                row.settlement_id,
                row.created_at,
                row.confirmed_at,
                row.from_member_id,
                row.from_name,
                row.to_member_id,
                row.to_name,
                row.amount,
                row.method,
                row.status,
                row.reference,
                row.note,
            ]
            for row in report.settlements
        ],
        money_columns={7},
        datetime_columns={1, 2},
    )
    workbook.close()
    return output.getvalue()
