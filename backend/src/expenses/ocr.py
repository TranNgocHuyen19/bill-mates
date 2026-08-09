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
QUANTITY_PATTERN = re.compile(r"(?<!\d)(\d+(?:[.,]\d+)?)\s*[xX*]\s*")
TOTAL_KEYWORDS = (
    "tong cong",
    "tong tien",
    "thanh tien",
    "phai tra",
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
    "cam on",
    "thank",
)
MERCHANT_NOISE = (
    "hoa don",
    "invoice",
    "receipt",
    "ngay",
    "date",
    "ma so",
    "tax code",
)


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
    all_amounts: list[int] = []
    for line in lines:
        text = str(line.get("text", ""))
        amounts = [amount for _, amount in _money_matches(text)]
        all_amounts.extend(amounts)
        normalized = _ascii_fold(text)
        for priority, keyword in enumerate(TOTAL_KEYWORDS):
            if keyword in normalized and amounts:
                keyword_candidates.append((len(TOTAL_KEYWORDS) - priority, amounts[-1]))
                break
    if keyword_candidates:
        return max(
            keyword_candidates,
            key=lambda candidate: (candidate[0], candidate[1]),
        )[1]
    return max(all_amounts, default=None)


def _item_suggestions(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    suggestions: list[dict[str, Any]] = []
    for line in lines:
        text = str(line.get("text", "")).strip()
        normalized = _ascii_fold(text)
        if not text or any(keyword in normalized for keyword in NON_ITEM_KEYWORDS):
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
    return {
        "provider": "paddleocr",
        "model": model,
        "language": language,
        "merchant": _merchant_from_lines(cleaned_lines),
        "total_amount": _total_from_lines(cleaned_lines),
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
