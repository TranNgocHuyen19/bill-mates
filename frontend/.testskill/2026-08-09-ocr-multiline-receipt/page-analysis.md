# Multiline Receipt OCR Flow Analysis

## Failure Evidence

- Upload endpoint returned `201`.
- OCR endpoint returned `200`.
- PaddleOCR recognized the product names, barcodes, prices, quantities, and totals with high confidence.
- Persisted OCR output contained only four invalid suggestions based on status-bar and `Scode` lines.
- Persisted receipt total was a long `Scode` number instead of `294844`.

## Root Cause

- `_item_suggestions` only accepts a line containing both alphabetic text and money.
- This supermarket receipt prints product names on one row and numeric columns on the next row.
- `_total_from_lines` only pairs a total keyword with money on the same OCR line.
- Its fallback selects the largest number, allowing barcodes and `Scode` values to win.

## Required Parser Behavior

- Detect product header rows by their item sequence prefix.
- Group following OCR boxes until the next product header.
- Select the rightmost numeric box as line total.
- Read unit price and quantity from the middle columns.
- Keep the existing same-line parser as a fallback for receipts without positional boxes.

## Multi-Image Upload Elements

- The hidden file input accepts multiple JPEG, PNG, or WebP images.
- Every selected image has a numbered preview and an accessible remove button.
- The status region reports the current image and total image count while uploading and scanning.
- Selecting more files appends only files that are not already selected.

## Combined OCR Review

- The split page loads the complete receipt collection for the draft expense.
- Receipts that have not been scanned are processed sequentially.
- The review header reports both the unique item count and source image count.
- Suggestions are flattened in image order and duplicate overlap rows are removed.
- Failed images produce a warning without hiding successful suggestions from other images.
- Retrying scans all images and refreshes the receipt collection.

## Original Image Gallery

- The review card contains an accessible original-image section.
- The active image is loaded through the authenticated backend image endpoint.
- Previous/next controls and numbered image buttons switch between receipt images.
- The image is constrained inside the review card so it does not cover the entire mobile screen.
- A failed image fetch shows an inline retry action.
