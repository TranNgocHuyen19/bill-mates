from decimal import ROUND_DOWN, Decimal
from uuid import UUID

from src.exceptions import AppError
from src.expenses.schemas import SplitParticipant
from src.models import SplitMethod

VND_UNIT = Decimal(1)


def _distribute_remainder(
    total: Decimal,
    raw_amounts: dict[UUID, Decimal],
) -> dict[UUID, Decimal]:
    rounded = {
        member_id: amount.quantize(VND_UNIT, rounding=ROUND_DOWN)
        for member_id, amount in raw_amounts.items()
    }
    remainder = int((total - sum(rounded.values())).quantize(VND_UNIT))
    ordered_members = sorted(rounded, key=str)
    for index in range(remainder):
        rounded[ordered_members[index % len(ordered_members)]] += VND_UNIT
    return rounded


def calculate_split(
    *,
    total: Decimal,
    method: SplitMethod,
    participants: list[SplitParticipant],
) -> dict[UUID, Decimal]:
    if total <= 0 or not participants:
        raise AppError(
            code="invalid_split",
            message="Món cần số tiền dương và ít nhất một người tham gia.",
            status_code=422,
        )

    if method == SplitMethod.EXACT:
        exact = {
            participant.member_id: (participant.share_value or Decimal(0))
            for participant in participants
        }
        if sum(exact.values()) != total:
            raise AppError(
                code="exact_split_mismatch",
                message="Tổng số tiền chia chính xác phải bằng tổng tiền món.",
                status_code=422,
                details={"expected": str(total), "actual": str(sum(exact.values()))},
            )
        return exact

    if method == SplitMethod.PERCENTAGE:
        percentages = [
            participant.share_value or Decimal(0) for participant in participants
        ]
        if sum(percentages) != Decimal(100):
            raise AppError(
                code="percentage_split_mismatch",
                message="Tổng phần trăm phải bằng 100.",
                status_code=422,
                details={"actual": str(sum(percentages))},
            )
        raw = {
            participant.member_id: total
            * (participant.share_value or Decimal(0))
            / Decimal(100)
            for participant in participants
        }
        return _distribute_remainder(total, raw)

    weights = {
        participant.member_id: (
            Decimal(1)
            if method == SplitMethod.EQUAL
            else participant.share_value or Decimal(0)
        )
        for participant in participants
    }
    total_weight = sum(weights.values())
    if total_weight <= 0:
        raise AppError(
            code="invalid_share_weight",
            message="Tổng trọng số phải lớn hơn 0.",
            status_code=422,
        )
    raw = {
        member_id: total * weight / total_weight
        for member_id, weight in weights.items()
    }
    return _distribute_remainder(total, raw)
