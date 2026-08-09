# Test Plan: Expense deletion and itemized splitting

## Scope

- Room dashboard recent expenses
- Draft expense item and split step
- Expense posting and debt calculation

## SRS basis

- FR-EXP-02: One expense contains one or more expense items.
- FR-EXP-03: Whole-bill splitting is represented by one aggregate item.
- FR-EXP-04: Each item has its own participants and split method.
- FR-EXP-11: Cancelled expenses do not affect debt.
- FR-BAL-01: Member debt is calculated from item split `amount_owed`.
- AC-02: A 200,000 VND expense with three items and different member groups can be posted.

## Acceptance scenarios

### Dashboard

1. Given a room has posted, draft, and cancelled expenses, the recent expense list shows only posted expenses.
2. A cancelled expense remains available in audit history but is absent from the dashboard recent list and total.
3. A draft remains available in the dedicated draft list and is absent from the dashboard recent list and total.

### Itemized bill

1. The split page defaults to itemized mode and does not prefill the entire remaining bill amount as the first item's amount.
2. The page clearly explains that each item can have its own users and split method.
3. Saving the first item resets the editor so another item can be added.
4. Each saved item displays its amount, participants, split method, and allocated amount per member.
5. The continue action remains disabled while item totals differ from the expense total or any item has no split.
6. Whole-bill splitting remains available as an explicit quick option and creates one aggregate item.

### Debt integrity

1. Posting a multi-item expense succeeds only when item totals equal the expense total and every item split reconciles.
2. Member debt equals the sum of that member's `ExpenseItemSplit.amount_owed` across posted expenses.
3. Draft and cancelled expenses contribute zero to debt.

## Verification

- Run backend expense and debt service tests.
- Run frontend typecheck, lint, formatting check, and production build.
- Inspect the dashboard and split page at a mobile viewport.
- Confirm the latest database expense statuses and item counts with a read-only query.
