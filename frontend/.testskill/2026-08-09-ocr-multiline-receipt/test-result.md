# OCR Multi-Image Test Result

## Result

- Status: passed.
- Backend OCR unit and service tests: `17 passed`.
- Backend Ruff check: passed.
- Backend Ruff format check: passed.
- Frontend typecheck: passed.
- Frontend Vitest: `6 passed`.
- Frontend ESLint: passed with no warnings.
- Frontend production build: passed.

## Real Receipt Smoke Test

- Lotte Mart image: 10 item suggestions, item sum `294844`, receipt total `294844`.
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
