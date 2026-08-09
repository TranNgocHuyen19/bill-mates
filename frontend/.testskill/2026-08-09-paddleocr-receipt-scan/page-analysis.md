# Expense Receipt Scan Page Analysis

## Runtime observation

- Target: `http://localhost:3000/expenses/new`
- Runtime state: unauthenticated browser sessions redirect to the BillMates login
  page, so no financial data or authenticated action was accessed.
- Login accessibility snapshot exposes labelled email/password textboxes, a
  password visibility button, login button, Google login button, and registration
  link.

## Authenticated page skeleton from source

### Step 1: `/expenses/new`

- Room selector, expense title, formatted total input, payer selector, expense
  date, note, and receipt image input.
- Receipt accepts JPEG, PNG, and WebP up to 10 MB.
- Primary outcomes are `Lưu nháp` and `Tiếp tục chia`.
- Receipt upload currently happens only after the draft is created.

### Step 2: `/expenses/new/split`

- Displays draft total, entered total, remaining amount, item count, saved items,
  and per-item splits.
- Supports itemized and whole-bill entry modes.
- `ExpenseItemEditor` contains item name, formatted amount, split method, member
  selection, split preview, and save action.
- The sticky continue action sits above mobile bottom navigation.

## OCR additions to preserve

- Image selection must show a compact preview and filename without increasing the
  page beyond the mobile viewport width.
- Upload/scan progress needs a live status label and disabled duplicate actions.
- OCR suggestions must remain editable and require an explicit user action before
  becoming expense items.
- Each suggestion should feed the existing item editor so the user still chooses
  members and a split method.
- Failed OCR must preserve the existing draft and offer retry.

## Network calls

- Existing: `POST /api/v1/rooms/{room_id}/expenses`
- Existing: `POST /api/v1/expenses/{expense_id}/receipts`
- New: `GET /api/v1/expense-receipts/{receipt_id}`
- New: `POST /api/v1/expense-receipts/{receipt_id}/ocr`
- Existing item flow: `POST /api/v1/expenses/{expense_id}/items`, then
  `PUT /api/v1/expense-items/{item_id}/splits`

## ARIA and locator requirements

- File input needs an explicit accessible label.
- Scan state should use `role="status"` and failure should use `role="alert"`.
- Suggestion actions need names that include the corresponding item.
- Editable suggestion name/amount fields need unique labels.
- Selection controls must expose pressed/selected state.

## Responsive risks

- Long filenames and merchant names need truncation.
- Name and amount fields should stack on narrow screens.
- OCR item actions must not create a third fixed/sticky layer.
- Currency amounts need tabular numerals and compact sizing below 360 px.
