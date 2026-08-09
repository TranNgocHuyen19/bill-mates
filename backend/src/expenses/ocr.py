import re
import threading
import unicodedata
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from src.config import settings

MONEY_PATTERN = re.compile(
    r"(?<!\d)(?:\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{2})?|\d{4,}(?:[.,]\d{2})?)(?!\d)"
)
NUMBER_TOKEN_PATTERN = re.compile(r"(?<![\w])\d+(?:[.,]\d+)*(?![\w])")
QUANTITY_PATTERN = re.compile(r"(?<!\d)(\d+(?:[.,]\d+)?)\s*[xX*]\s*")
ITEM_HEADER_PATTERN = re.compile(r"^\s*(\d{1,3})\s+(.+?)\s*$")
TOTAL_KEYWORDS = (
    "tien nhan",
    "tong cong",
    "tong tien",
    "thanh tien",
    "phai tra",
    "phai thanh toan",
    "phi thanh toan",
    "payment due",
    "grand total",
    "total",
)
NON_ITEM_KEYWORDS = (
    *TOTAL_KEYWORDS,
    "tam tinh",
    "subtotal",
    "thue",
    "tax",
    "vat",
    "giam gia",
    "discount",
    "tien mat",
    "cash",
    "the",
    "card",
    "hoa don",
    "invoice",
    "ngay",
    "date",
    "gio",
    "time",
    "qr",
    "ma hoa don",
    "qua tang",
    "phieu mua hang",
    "cam on",
    "thank",
)
PREFIX_ONLY_NOISE_KEYWORDS = (
    "cash",
    "the",
    "card",
    "ngay",
    "date",
    "gio",
    "time",
    "qr",
)
MERCHANT_NOISE = (
    "hoa don",
    "hoa don dien tu",
    "invoice",
    "receipt",
    "phieu thanh toan",
    "kb/s",
    "so ct",
    "ngay",
    "date",
    "ma so",
    "tax code",
)
MAX_REASONABLE_RECEIPT_AMOUNT = 1_000_000_000_000


class OcrUnavailableError(RuntimeError):
    """Báo PaddleOCR chưa sẵn sàng trong môi trường chạy."""


class OcrProcessingError(RuntimeError):
    """Báo ảnh không thể được PaddleOCR xử lý."""


def _ascii_fold(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.casefold())
    folded = "".join(
        character for character in normalized if not unicodedata.combining(character)
    )
    return folded.replace("đ", "d")


def _parse_money_token(token: str) -> int | None:
    compact = re.sub(r"[^\d.,]", "", token)
    if not compact:
        return None

    separators = [index for index, character in enumerate(compact) if character in ".,"]
    if not separators:
        return int(compact)

    last_separator = separators[-1]
    decimal_digits = len(compact) - last_separator - 1
    integer_part = compact[:last_separator]
    if decimal_digits == 2 and (
        len(separators) > 1 or len(re.sub(r"\D", "", integer_part)) >= 4
    ):
        compact = compact[:last_separator]

    digits = re.sub(r"\D", "", compact)
    return int(digits) if digits else None


def _money_matches(text: str) -> list[tuple[re.Match[str], int]]:
    matches: list[tuple[re.Match[str], int]] = []
    for match in MONEY_PATTERN.finditer(text):
        amount = _parse_money_token(match.group())
        if amount is not None:
            matches.append((match, amount))
    return matches


def _signed_money_matches(text: str) -> list[int]:
    amounts: list[int] = []
    for match in NUMBER_TOKEN_PATTERN.finditer(text):
        amount = _parse_money_token(match.group())
        if amount is None:
            continue
        amounts.append(
            -amount if text[: match.start()].rstrip().endswith("-") else amount
        )
    return amounts


def _percentage_values(text: str) -> list[float]:
    values: list[float] = []
    for match in re.finditer(r"(?<!\d)(\d+(?:[.,]\d+)?)\s*%", text):
        values.append(float(match.group(1).replace(",", ".")))
    return values


def _box_values(line: dict[str, Any]) -> tuple[float, float, float, float] | None:
    box = line.get("box")
    if not isinstance(box, (list, tuple)) or len(box) < 4:
        return None
    try:
        left, top, right, bottom = (float(value) for value in box[:4])
    except (TypeError, ValueError):
        return None
    return left, top, right, bottom


def _numeric_tokens(text: str) -> list[tuple[str, int]]:
    tokens: list[tuple[str, int]] = []
    for match in NUMBER_TOKEN_PATTERN.finditer(text):
        token = match.group()
        after_token = text[match.end() :].lstrip()
        if after_token.startswith("%"):
            continue
        amount = _parse_money_token(token)
        if amount is not None:
            tokens.append((token, amount))
    return tokens


def _parse_quantity_token(token: str) -> float | None:
    compact = token.replace(" ", "")
    if "," in compact and "." in compact:
        compact = compact.replace(".", "").replace(",", ".")
    else:
        compact = compact.replace(",", ".")
    try:
        quantity = float(compact)
    except ValueError:
        return None
    return quantity if 0 < quantity <= 1_000 else None


def _is_barcode_line(text: str) -> bool:
    compact = re.sub(r"\s+", "", text)
    return bool(re.fullmatch(r"\d{8,}", compact))


def _is_scode_line(text: str) -> bool:
    return _ascii_fold(text).replace(" ", "").startswith("scode")


def _is_noise_line(text: str) -> bool:
    normalized = _ascii_fold(text)
    return (
        _is_barcode_line(text)
        or _is_scode_line(text)
        or any(
            normalized.startswith(keyword)
            if keyword in PREFIX_ONLY_NOISE_KEYWORDS
            else keyword in normalized
            for keyword in NON_ITEM_KEYWORDS
        )
    )


def _line_numbers(line: dict[str, Any]) -> list[tuple[str, int]]:
    if _is_barcode_line(str(line.get("text", ""))):
        return []
    return _numeric_tokens(str(line.get("text", "")))


def _item_name_from_line(text: str) -> str:
    match = ITEM_HEADER_PATTERN.match(text)
    if match and not match.group(2).lstrip().startswith("%"):
        return match.group(2).strip(" \t-:|.")
    return text.strip(" \t-:|.")


def _is_name_line(line: dict[str, Any], page_width: float) -> bool:
    text = str(line.get("text", "")).strip()
    box = _box_values(line)
    if not text or box is None or box[0] > page_width * 0.2:
        return False
    if _is_noise_line(text) or not any(character.isalpha() for character in text):
        return False
    name = _item_name_from_line(text)
    return len(name) >= 2 and not name.lstrip().startswith("%")


def _row_lines(
    lines: list[dict[str, Any]],
    total_index: int,
    page_width: float,
) -> list[tuple[int, dict[str, Any], tuple[float, float, float, float]]]:
    total_box = _box_values(lines[total_index])
    if total_box is None:
        return []
    total_center = (total_box[1] + total_box[3]) / 2
    result: list[tuple[int, dict[str, Any], tuple[float, float, float, float]]] = []
    for index, line in enumerate(lines):
        box = _box_values(line)
        if box is None:
            continue
        center = (box[1] + box[3]) / 2
        if abs(center - total_center) <= 28:
            result.append((index, line, box))
    return result


def _select_column_item(
    lines: list[dict[str, Any]],
    total_index: int,
    page_width: float,
    used_name_indexes: set[int],
) -> dict[str, Any] | None:
    total_line = lines[total_index]
    total_box = _box_values(total_line)
    if total_box is None:
        return None
    total_values = _line_numbers(total_line)
    if not total_values:
        return None
    total_amount = total_values[-1][1]
    if total_amount <= 0 or total_amount > MAX_REASONABLE_RECEIPT_AMOUNT:
        return None

    row_lines = _row_lines(lines, total_index, page_width)
    numeric_values: list[tuple[float, int, bool, str]] = []
    price_values: list[int] = []
    quantity_values: list[float] = []
    for index, line, box in row_lines:
        if index == total_index:
            continue
        text = str(line.get("text", "")).strip()
        for token, amount in _line_numbers(line):
            quantity = _parse_quantity_token(token)
            standalone = bool(re.fullmatch(r"[\d.,\s]+", text))
            numeric_values.append((box[0], amount, standalone, token))
            if quantity is not None and standalone:
                quantity_values.append(quantity)
            if amount > 0:
                price_values.append(amount)

    if not numeric_values:
        return None

    quantity = next(
        (value for value in quantity_values if value != 1 or len(quantity_values) == 1),
        1.0,
    )
    if not quantity_values:
        decimal_quantities = [
            quantity
            for _, _, _, token in numeric_values
            if ("," in token or "." in token)
            and (quantity := _parse_quantity_token(token)) is not None
            and quantity < 1
        ]
        quantity = decimal_quantities[-1] if decimal_quantities else 1.0

    matching_prices = [
        value
        for value in price_values
        if value > 0
        and value <= MAX_REASONABLE_RECEIPT_AMOUNT
        and abs(round(value * quantity) - total_amount) <= 1
    ]
    if matching_prices:
        unit_price = matching_prices[-1]
    else:
        unit_price = min(
            (
                value
                for value in price_values
                if value > 0 and value <= MAX_REASONABLE_RECEIPT_AMOUNT
            ),
            key=lambda value: abs(value * quantity - total_amount),
            default=0,
        )
    if unit_price <= 0:
        return None

    total_center = (total_box[1] + total_box[3]) / 2
    name_candidates: list[tuple[float, int, str]] = []
    for index in range(total_index - 1, -1, -1):
        if index in used_name_indexes:
            continue
        box = _box_values(lines[index])
        if box is None:
            continue
        center = (box[1] + box[3]) / 2
        distance = total_center - center
        if distance > 150:
            break
        if _is_name_line(lines[index], page_width):
            name_candidates.append(
                (distance, index, _item_name_from_line(str(lines[index]["text"])))
            )
    if not name_candidates:
        return None
    _, name_index, name = min(name_candidates, key=lambda candidate: candidate[0])
    if len(name) < 2:
        return None

    used_name_indexes.add(name_index)
    return {
        "name": name[:160],
        "quantity": quantity,
        "unit_price": unit_price,
        "total_amount": total_amount,
        "_name_line_index": name_index,
        "_line_index": total_index,
        "confidence": round(
            min(
                float(lines[name_index].get("confidence", 0)),
                float(total_line.get("confidence", 0)),
            ),
            4,
        ),
    }


def _column_item_suggestions(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    boxes = [_box_values(line) for line in lines]
    valid_boxes = [box for box in boxes if box is not None]
    if not valid_boxes:
        return []
    page_width = max(box[2] for box in valid_boxes)
    suggestions: list[dict[str, Any]] = []
    used_name_indexes: set[int] = set()
    for index, line in enumerate(lines):
        box = boxes[index]
        if box is None or box[0] < page_width * 0.78:
            continue
        suggestion = _select_column_item(
            lines,
            index,
            page_width,
            used_name_indexes,
        )
        if suggestion is not None:
            suggestions.append(suggestion)
    for suggestion_index, suggestion in enumerate(suggestions):
        start_index = int(suggestion["_line_index"]) + 1
        end_index = (
            int(suggestions[suggestion_index + 1]["_name_line_index"])
            if suggestion_index + 1 < len(suggestions)
            else len(lines)
        )
        discount_lines = [
            str(line.get("text", ""))
            for line in lines[start_index:end_index]
            if not any(
                keyword in _ascii_fold(str(line.get("text", "")))
                for keyword in ("giam gia", "discount")
            )
        ]
        has_item_discount_marker = any(
            "stiker" in _ascii_fold(text)
            or ("%" in text and "vat" not in _ascii_fold(text))
            for text in discount_lines
        )
        discount_amount = (
            sum(
                abs(amount)
                for text in discount_lines
                for amount in _signed_money_matches(text)
                if amount < 0
            )
            if has_item_discount_marker
            else 0
        )
        if discount_amount:
            original_total = suggestion["total_amount"]
            applied_discount = min(discount_amount, original_total)
            suggestion["original_total_amount"] = original_total
            suggestion["discount_amount"] = applied_discount
            percentages = [
                value for text in discount_lines for value in _percentage_values(text)
            ]
            if percentages:
                suggestion["discount_percent"] = percentages[-1]
            suggestion["total_amount"] = original_total - applied_discount
        suggestion.pop("_name_line_index", None)
        suggestion.pop("_line_index", None)
    return suggestions


def _merchant_from_lines(lines: list[dict[str, Any]]) -> str | None:
    for line in lines[:8]:
        text = str(line.get("text", "")).strip()
        normalized = _ascii_fold(text)
        if (
            2 <= len(text) <= 100
            and any(character.isalpha() for character in text)
            and not any(keyword in normalized for keyword in MERCHANT_NOISE)
            and not _money_matches(text)
        ):
            return text
    return None


def _total_from_lines(lines: list[dict[str, Any]]) -> int | None:
    keyword_candidates: list[tuple[int, int]] = []
    for line_index, line in enumerate(lines):
        text = str(line.get("text", ""))
        amounts = [amount for _, amount in _money_matches(text)]
        normalized = _ascii_fold(text)
        for priority, keyword in enumerate(TOTAL_KEYWORDS):
            if keyword not in normalized:
                continue
            if not amounts:
                for next_line in lines[line_index + 1 : line_index + 4]:
                    amounts = [
                        amount
                        for _, amount in _money_matches(str(next_line.get("text", "")))
                    ]
                    if amounts:
                        break
            if amounts and amounts[-1] <= MAX_REASONABLE_RECEIPT_AMOUNT:
                keyword_candidates.append((len(TOTAL_KEYWORDS) - priority, amounts[-1]))
                break
    if keyword_candidates:
        return max(
            keyword_candidates,
            key=lambda candidate: (candidate[0], candidate[1]),
        )[1]
    return None


def _subtotal_from_lines(lines: list[dict[str, Any]]) -> int | None:
    for line_index, line in enumerate(lines):
        if "tong cong" not in _ascii_fold(str(line.get("text", ""))):
            continue
        amounts = [amount for _, amount in _money_matches(str(line.get("text", "")))]
        if not amounts:
            for next_line in lines[line_index + 1 : line_index + 4]:
                amounts = [
                    amount
                    for _, amount in _money_matches(str(next_line.get("text", "")))
                ]
                if amounts:
                    break
        if amounts:
            return amounts[-1]
    return None


def _discount_summary(lines: list[dict[str, Any]]) -> tuple[int | None, int | None]:
    total_discount = 0
    order_discount = 0
    for line_index, line in enumerate(lines):
        text = str(line.get("text", ""))
        normalized = _ascii_fold(text)
        if "giam gia" not in normalized and "discount" not in normalized:
            continue
        amounts = _signed_money_matches(text)
        if not amounts:
            for next_line in lines[line_index + 1 : line_index + 3]:
                amounts = _signed_money_matches(str(next_line.get("text", "")))
                if amounts:
                    break
        for amount in amounts:
            if amount >= 0:
                continue
            discount = abs(amount)
            total_discount += discount
            if "don" in normalized:
                order_discount += discount
    return (
        total_discount or None,
        order_discount or None,
    )


def _inline_item_suggestions(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    suggestions: list[dict[str, Any]] = []
    for line in lines:
        text = str(line.get("text", "")).strip()
        if not text or _is_noise_line(text):
            continue

        amount_matches = _money_matches(text)
        if not amount_matches:
            continue

        first_match = amount_matches[0][0]
        quantity_match = QUANTITY_PATTERN.search(text)
        name_end = quantity_match.start() if quantity_match else first_match.start()
        name = text[:name_end].strip(" \t-:|.")
        if len(name) < 2 or not any(character.isalpha() for character in name):
            continue

        total_amount = amount_matches[-1][1]
        quantity = 1.0
        if quantity_match:
            quantity = float(quantity_match.group(1).replace(",", "."))
        unit_price = (
            amount_matches[-2][1]
            if quantity_match and len(amount_matches) >= 2
            else round(total_amount / quantity)
        )
        suggestions.append(
            {
                "name": name[:160],
                "quantity": quantity,
                "unit_price": unit_price,
                "total_amount": total_amount,
                "confidence": round(float(line.get("confidence", 0)), 4),
            }
        )
    return suggestions


def _item_suggestions(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    column_suggestions = _column_item_suggestions(lines)
    return column_suggestions or _inline_item_suggestions(lines)


def parse_receipt_lines(
    lines: list[dict[str, Any]],
    *,
    model: str = "PP-OCRv5",
    language: str = "vi",
) -> dict[str, Any]:
    """Biến các dòng OCR thành gợi ý hóa đơn có thể chỉnh sửa."""
    cleaned_lines = [
        {
            "text": str(line.get("text", "")).strip(),
            "confidence": round(float(line.get("confidence", 0)), 4),
            "box": line.get("box"),
        }
        for line in lines
        if str(line.get("text", "")).strip()
    ]
    confidences = [line["confidence"] for line in cleaned_lines]
    discount_amount, order_discount_amount = _discount_summary(cleaned_lines)
    return {
        "provider": "paddleocr",
        "model": model,
        "language": language,
        "merchant": _merchant_from_lines(cleaned_lines),
        "total_amount": _total_from_lines(cleaned_lines),
        "subtotal_amount": _subtotal_from_lines(cleaned_lines),
        "discount_amount": discount_amount,
        "order_discount_amount": order_discount_amount,
        "average_confidence": (
            round(sum(confidences) / len(confidences), 4) if confidences else 0
        ),
        "items": _item_suggestions(cleaned_lines),
        "lines": cleaned_lines,
        "raw_text": "\n".join(line["text"] for line in cleaned_lines),
    }


class PaddleOcrEngine:
    """Khởi tạo PaddleOCR khi có yêu cầu quét đầu tiên."""

    _instance: Any | None = None
    _lock = threading.Lock()

    @classmethod
    def _get_instance(cls) -> Any:
        if cls._instance is not None:
            return cls._instance
        with cls._lock:
            if cls._instance is not None:
                return cls._instance
            try:
                from paddleocr import PaddleOCR
            except ImportError as error:
                raise OcrUnavailableError(
                    "PaddleOCR chưa được cài. Hãy cài requirements.txt của backend."
                ) from error
            cls._instance = PaddleOCR(
                text_detection_model_name=settings.OCR_TEXT_DETECTION_MODEL,
                text_recognition_model_name=settings.OCR_TEXT_RECOGNITION_MODEL,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
                device=settings.OCR_DEVICE,
                cpu_threads=settings.OCR_CPU_THREADS,
                enable_mkldnn=settings.OCR_ENABLE_MKLDNN,
            )
            return cls._instance

    @classmethod
    def scan(cls, image_content: bytes) -> dict[str, Any]:
        if not settings.OCR_ENABLED:
            raise OcrUnavailableError("Tính năng PaddleOCR đang bị tắt trên máy chủ.")

        try:
            with TemporaryDirectory(prefix="billmates-ocr-") as temporary_directory:
                image_path = Path(temporary_directory) / "receipt.jpg"
                image_path.write_bytes(image_content)
                results = cls._get_instance().predict(str(image_path))
                lines = cls._extract_lines(results)
        except OcrUnavailableError:
            raise
        except Exception as error:
            raise OcrProcessingError(
                "PaddleOCR không thể đọc ảnh hóa đơn này."
            ) from error

        if not lines:
            raise OcrProcessingError(
                "Không nhận diện được chữ trên ảnh. Hãy chụp lại bill rõ và thẳng hơn."
            )
        return parse_receipt_lines(
            lines,
            model=settings.OCR_VERSION,
            language=settings.OCR_LANGUAGE,
        )

    @staticmethod
    def _extract_lines(results: Any) -> list[dict[str, Any]]:
        lines: list[dict[str, Any]] = []
        for result in results:
            payload = result.json
            page = payload.get("res", payload)
            texts = page.get("rec_texts", [])
            scores = page.get("rec_scores", [])
            boxes = page.get("rec_boxes", [])
            if hasattr(scores, "tolist"):
                scores = scores.tolist()
            if hasattr(boxes, "tolist"):
                boxes = boxes.tolist()
            for index, text in enumerate(texts):
                lines.append(
                    {
                        "text": str(text),
                        "confidence": (
                            float(scores[index]) if index < len(scores) else 0
                        ),
                        "box": boxes[index] if index < len(boxes) else None,
                    }
                )
        return lines


def process_receipt_image(image_content: bytes) -> dict[str, Any]:
    """Quét một ảnh hóa đơn bằng PaddleOCR."""
    return PaddleOcrEngine.scan(image_content)
