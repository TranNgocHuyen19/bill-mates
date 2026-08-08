from decimal import Decimal
from uuid import UUID

import pytest

from src.exceptions import AppError
from src.expenses.calculations import calculate_split
from src.expenses.schemas import SplitParticipant
from src.models import SplitMethod

MEMBERS = [
    UUID("00000000-0000-0000-0000-000000000003"),
    UUID("00000000-0000-0000-0000-000000000001"),
    UUID("00000000-0000-0000-0000-000000000002"),
]


def participants(*values: Decimal | None) -> list[SplitParticipant]:
    return [
        SplitParticipant(member_id=member_id, share_value=value)
        for member_id, value in zip(MEMBERS, values, strict=True)
    ]


def test_equal_split_distributes_remainder_by_stable_member_order() -> None:
    result = calculate_split(
        total=Decimal(100_000),
        method=SplitMethod.EQUAL,
        participants=participants(None, None, None),
    )

    assert sum(result.values()) == Decimal(100_000)
    assert result[MEMBERS[1]] == Decimal(33_334)
    assert result[MEMBERS[2]] == Decimal(33_333)
    assert result[MEMBERS[0]] == Decimal(33_333)


def test_percentage_and_shares_match_acceptance_examples() -> None:
    percentages = calculate_split(
        total=Decimal(100_000),
        method=SplitMethod.PERCENTAGE,
        participants=participants(Decimal(20), Decimal(30), Decimal(50)),
    )
    shares = calculate_split(
        total=Decimal(100_000),
        method=SplitMethod.SHARES,
        participants=participants(Decimal(1), Decimal(1), Decimal(2)),
    )

    assert list(percentages.values()) == [
        Decimal(20_000),
        Decimal(30_000),
        Decimal(50_000),
    ]
    assert list(shares.values()) == [Decimal(25_000), Decimal(25_000), Decimal(50_000)]


def test_exact_split_rejects_mismatched_total() -> None:
    with pytest.raises(AppError, match="Tổng số tiền"):
        calculate_split(
            total=Decimal(100_000),
            method=SplitMethod.EXACT,
            participants=participants(
                Decimal(30_000), Decimal(30_000), Decimal(30_000)
            ),
        )
