# Expense Reports And Excel Export Verification

## Result

**PASS WITH AUTHENTICATED UI INSPECTION PENDING**

The full-stack report implementation compiles, builds, passes backend tests, and
produces a valid independently parsed Excel workbook. The authenticated `/reports`
page could not be visually exercised in the isolated browser because no Supabase test
session or demo account is available.

## Automated Checks

| Check | Result |
| --- | --- |
| Backend pytest | PASS - 11 tests |
| Backend Ruff | PASS |
| Frontend TypeScript | PASS |
| Frontend ESLint | PASS |
| Changed-file Prettier check | PASS |
| Next.js production build | PASS - `/reports` build artifact generated |
| Git whitespace check | PASS |

## API Verification

- OpenAPI contains `GET /api/v1/rooms/{room_id}/reports`.
- OpenAPI contains `GET /api/v1/rooms/{room_id}/reports/export`.
- A report request without a Bearer token returns the shared `401
  missing_authorization` envelope.
- Service tests verify posted-only totals, draft exclusion, confirmed settlement
  accounting, category aggregation, and zero-sum member balances.

## Workbook Verification

The generated workbook was parsed independently with `openpyxl`:

- Sheets are ordered as `Summary`, `Expenses`, `Items`, `Splits`, `Balances`,
  `Settlements`.
- Expense dates are real Excel date cells with `dd/mm/yyyy` formatting.
- Money values are numeric cells with a VND number format.
- Vietnamese text round-trips correctly.
- User text beginning with `=` and `+` remains a string, not a formula.
- The OOXML workbook contains no worksheet formula nodes.

## Responsive And Accessibility Audit

Source inspection confirms:

- Mobile-first stacked filters with 48-pixel controls.
- Five-item bottom navigation with Reports replacing History.
- `min-w-0`, constrained select portals, and body overflow clipping.
- Horizontal scrolling is isolated to the monthly chart.
- Text/icon status labels do not rely only on color.
- Labeled controls, alert relationships, busy state, chart text alternative, and
  section labels are present.

## Deferred Check

An authenticated browser session is still required to visually inspect the populated
page at 320, 360, 390, 440, 768, and 1440 pixel widths and to exercise a real Excel
download against Supabase data. The unauthenticated runtime correctly redirects
`/reports` to `/auth/login`.
