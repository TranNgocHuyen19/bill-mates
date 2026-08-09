# OCR Multi-Image Test Result

## Result

- Status: passed.
- Backend OCR unit and service tests: `17 passed`.
- Backend Ruff check: passed.
- Backend Ruff format check: passed.
- Frontend typecheck: passed.
- Frontend Vitest: `7 passed`.
- Frontend ESLint: passed with no warnings.
- Frontend production build: passed.
- Independent verifier agent: unavailable because the configured provider had no active credentials.

## Real Receipt Smoke Test

- Lotte Mart image: 10 item suggestions, subtotal `294844`, net item sum `288544`, and payable total `288500`.
- `MONG TOI BABY 300G`: original `31500`, item discount `20%` / `6300`, net `25200`.
- Lotte summary discounts: product `6300`, order `44`, total discount `6344`.
- VAT declaration lines are retained in raw OCR text and excluded from all calculations.
- Bach Hoa Xanh top image: 14 item suggestions, item sum `575599`; the receipt total is printed on the other image.
- Bach Hoa Xanh bottom image: 10 item suggestions, receipt total `724447`.
- Combined Bach Hoa Xanh result: 21 unique suggestions after overlap deduplication, item sum `724447`.

## Covered Behaviors

- Multiline supermarket rows are parsed using OCR box positions.
- Quantity/weight and unit price are retained for weighted products.
- Multiple images can be selected, previewed, appended, and removed.
- Receipt images are uploaded and scanned sequentially.
- Overlapping screenshot rows are deduplicated by normalized name and line total.
- Protected original images are displayed inline and can be switched without leaving the OCR review.
- Discounted items display the original amount, percentage, discount amount, and net amount.
- The compact receipt summary displays subtotal, discount, and payable total.
- The `44` order discount is visibly allocated to an eligible non-discounted item, making imported OCR items total `288500`.

## Residual Risk

- The independent test-verifier gate could not run; local automated tests, production build, and exact-image smoke tests provide the available verification.
