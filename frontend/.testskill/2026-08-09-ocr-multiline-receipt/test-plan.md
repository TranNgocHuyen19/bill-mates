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
- Small OCR differences in an overlapping row are deduplicated using near-name matching and a guarded amount tolerance.
- Near-name rows with different quantities or unit prices remain separate to avoid merging distinct products.
- Identical rows inside the same source image are preserved because overlap filtering only compares different images.
- A total found only in the final image is used as the combined receipt total.
- The OCR review displays the protected original receipt image for visual comparison.
- Multiple receipt images can be switched from the review gallery.
- An image download failure shows a retry action without hiding OCR suggestions.
- The original image stays visible while the item list is scrolled.
- Item-level discounts printed below a product reduce that product's OCR total and retain the original price, discount amount, and percentage.
- Receipt-level VAT declarations are informational and are never added to item totals.
- The payable amount after product and order discounts is selected as the receipt total.
- A receipt-level order discount is visibly allocated to one eligible OCR item so imported item totals match the payable amount.

## Receipt Fixture

- Ten products from the user-provided supermarket receipt.
- Expected subtotal: `294844`.
- Expected payable total after discounts: `288500`.
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
  - Lotte Mart: 10 items, net item sum `288544`, order discount `44`, and payable total `288500`.
- Bach Hoa Xanh: 21 unique merged items, item sum and receipt total `724447`.
- Lotte discount case: `MONG TOI BABY 300G` changes from `31500` to `25200` after a `20%` / `-6300` discount, while final payable is `288500`.
- Add component tests for multiple previews, removing one image, merging suggestions, and overlap deduplication.
- Add a component test that displays the original receipt image and switches between multiple images.
