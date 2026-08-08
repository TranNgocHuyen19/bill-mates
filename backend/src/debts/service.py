from typing import Any
from src.debts.schemas import SettleDebtInput


class DebtService:
    """Service handling Debt tracking, VietQR payment, and Cash Flow Minimization Algorithm."""

    @staticmethod
    def simplify_debts(balances: dict[str, float]) -> list[dict[str, Any]]:
        """Greedy Cash Flow Minimization Algorithm.
        Converts net balances of all members into the minimum number of transactions.
        """
        # Separate debtors (negative net balance) and creditors (positive net balance)
        debtors = []
        creditors = []

        for person, amount in balances.items():
            if amount < -0.01:
                debtors.append({'name': person, 'amount': -amount})
            elif amount > 0.01:
                creditors.append({'name': person, 'amount': amount})

        transactions = []
        i = 0
        j = 0

        while i < len(debtors) and j < len(creditors):
            debtor = debtors[i]
            creditor = creditors[j]

            settle_amount = min(debtor['amount'], creditor['amount'])

            transactions.append({
                "from_user": debtor['name'],
                "to_user": creditor['name'],
                "amount": settle_amount,
                "formatted_amount": f"{int(settle_amount):,} ₫"
            })

            debtor['amount'] -= settle_amount
            creditor['amount'] -= settle_amount

            if debtor['amount'] < 0.01:
                i += 1
            if creditor['amount'] < 0.01:
                j += 1

        return transactions

    @classmethod
    async def get_optimized_debts(cls, room_id: str) -> dict[str, Any]:
        # Simulated net balances for Room 101 members
        net_balances = {
            "Huyên": 320000.0,
            "Tuấn Anh": -180000.0,
            "Bảo Nam": -140000.0,
            "Minh Hoàng": 0.0
        }

        transactions = cls.simplify_debts(net_balances)

        return {
            "room_id": room_id,
            "total_transactions": len(transactions),
            "optimized_transactions": transactions,
            "debtsToReceive": [
                {"id": "d1", "name": "Tuấn Anh", "amount": "180.000 ₫", "reason": "Tiền Điện Tháng 8"},
                {"id": "d2", "name": "Bảo Nam", "amount": "140.000 ₫", "reason": "Tiền Điện + Tiền Chợ"}
            ],
            "debtsToPay": [
                {"id": "p1", "name": "Minh Hoàng", "amount": "150.000 ₫", "reason": "Tiền Nước Tháng 8"}
            ]
        }

    @staticmethod
    async def settle_debt(data: SettleDebtInput, user_id: str) -> dict[str, Any]:
        return {
            "status": "success",
            "message": f"Đã gửi thông báo xác nhận thanh toán {int(data.amount):,} ₫ qua {data.payment_method}.",
            "data": {
                "user_id": user_id,
                "to_user_id": data.to_user_id,
                "amount": data.amount
            }
        }
