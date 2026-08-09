# Multiline Receipt OCR Parser Test Plan

## Acceptance Criteria

- OCR lines where the product name and numeric columns are on separate rows produce one item suggestion per product.
- Product sequence prefixes such as `001` are removed from item names.
- Barcode and `Scode` values are never interpreted as item prices or receipt totals.
- Unit price, quantity or weight, and line total are parsed from their spatial columns.
- Three-digit amounts such as `300` remain valid item totals.
- A receipt total printed on the line after `Tong cong` is selected instead of the largest numeric token.
- Existing single-line receipt parsing remains unchanged.
- Users can select, preview, and remove multiple receipt images before creating a draft.
- Every uploaded image is scanned, while a failed image does not stop the remaining images.
- OCR suggestions from all images are shown in one review list.
- Overlapping screenshots are deduplicated by normalized item name and line total.
- A total found only in the final image is used as the combined receipt total.
- The OCR review displays the protected original receipt image for visual comparison.
- Multiple receipt images can be switched from the review gallery.
- An image download failure shows a retry action without hiding OCR suggestions.

## Receipt Fixture

- Ten products from the user-provided supermarket receipt.
- Expected total: `294844`.
- Representative weighted products:
  - `THIT HEO XAY`: `119000 x 0.310 = 36890`.
  - `CA BA SA PHI LE TAM UOP`: `139000 x 0.346 = 48094`.
- Representative low-value product:
  - `TUI NYLON SIZE 35-60`: `300 x 1 = 300`.

## Verification

- Add a parser regression test using the persisted OCR line structure.
- Run the backend OCR tests and full backend test suite.
- Run Ruff lint and formatting checks on changed backend files.
- Reprocess the exact uploaded image and compare item count and total.
- Reprocess all three user images:
  - Lotte Mart: 10 items, item sum and receipt total `294844`.
  - Bach Hoa Xanh: 21 unique merged items, item sum and receipt total `724447`.
- Add component tests for multiple previews, removing one image, merging suggestions, and overlap deduplication.
- Add a component test that displays the original receipt image and switches between multiple images.
