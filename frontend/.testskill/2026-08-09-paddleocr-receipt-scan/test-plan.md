# PaddleOCR Receipt Scan Test Plan

## Scope

Verify the mobile-first receipt scanning flow from image selection through editable
OCR suggestions, without automatically posting or changing an expense.

## Backend scenarios

1. When a valid receipt is uploaded, then its storage metadata is persisted with
   OCR status `not_requested`.
2. When OCR is requested for an accessible receipt, then the image is downloaded
   from Supabase Storage, processed off the async event loop, and the structured
   result is persisted with status `completed`.
3. When OCR processing fails, then status becomes `failed` and the API returns an
   actionable error without creating expense items.
4. When a receipt is missing or belongs to an inaccessible expense, then scanning
   is rejected.
5. When OCR text contains Vietnamese currency and item lines, then parser output
   contains editable merchant, total, and item suggestions.

## Frontend page scenarios

1. When a user selects a valid receipt image, then the image name and preview are
   shown and the scan action becomes available.
2. When upload and scan succeed, then editable merchant, total, and item
   suggestions are displayed.
3. When the user accepts selected suggestions, then item rows are added to the
   current expense draft and remain editable.
4. When upload or OCR fails, then a clear retryable error is shown and existing
   draft data is preserved.
5. When viewed at a narrow mobile viewport, then scan/review controls fit without
   horizontal overflow or covering primary navigation.

## Out of scope

- Automatically posting the expense.
- Automatically assigning item splits to room members.
- Training or fine-tuning OCR models.
- OCR for PDFs or files larger than the existing 10 MB upload limit.

## Definition of done

- Backend service and parser tests pass.
- Frontend page/component tests cover observable upload, result, and error states.
- Browser verification passes on mobile and desktop viewports.
- Typecheck, lint, build, Ruff, and backend test suite pass.
- No focused or skipped tests are introduced.
