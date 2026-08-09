# Expense Reports and Excel Export Test Plan

## Planning Metadata

- Context root: `frontend`
- Feature scope: full-stack room expense reports and `.xlsx` export
- Target route: `/reports`
- Proposed report endpoint:
  `GET /api/v1/rooms/{room_id}/reports?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
- Proposed export endpoint:
  `GET /api/v1/rooms/{room_id}/reports/export?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
- Frontend page framework: Vitest + React Testing Library
- Frontend network interception: Mock Service Worker
- Backend framework: pytest + pytest-asyncio
- Human review required by config: No

The endpoint names above are planning contracts. If implementation chooses different
paths, update the plan and tests together before coding tests.

## Objective

Verify that an active room member can view an accurate, mobile-first report for one
room and an inclusive date range, then download the same filtered data as a valid
Excel workbook. The report must aggregate posted expenses by month, category, and
member, and must include range-scoped balances and settlements without leaking data
from another room.

## Current Architecture Evidence

- FastAPI routers are mounted under `/api/v1` and use the shared `CurrentUser`
  Bearer-token dependency.
- SQLAlchemy models store expenses, items, splits, room categories, members, and
  settlements. Monetary columns use `Numeric`, and API schemas expose decimal values.
- Expense statuses are `draft`, `posted`, and `cancelled`.
- Settlement statuses are `pending`, `confirmed`, `rejected`, and `cancelled`.
- Existing balance logic counts only posted expenses and confirmed settlements.
- Frontend server state uses TanStack Query and the Axios client obtains a Supabase
  access token before every request.
- Room, expense, and debt pages already use room selection through `roomId` query
  parameters and Radix-backed selects.
- Navigation currently has no reports path or reports entry.
- No report API, report page, `.xlsx` library, frontend test script, or configured
  canonical test example exists yet.

## Report Contract and Accounting Rules

All tests use these rules as the definition of done:

1. `from_date` and `to_date` are required ISO dates and are inclusive.
2. Expense filtering uses `Expense.expense_date`, which is a date without timezone.
3. Only `posted` expenses contribute to counts, totals, month/category/member
   aggregates, and balances. Draft and cancelled expenses are excluded.
4. Monthly buckets use `YYYY-MM` derived from `expense_date` and are ordered oldest
   to newest.
5. Category totals sum item totals. Missing or deleted categories are grouped into a
   stable `Uncategorized` bucket. Category totals equal the filtered posted total.
6. Member aggregation exposes at least `paid`, `owed`, and `net` where
   `net = paid - owed + confirmed_sent - confirmed_received`.
7. Split amounts, not share input values, are authoritative for member `owed` totals.
8. Settlement rows are selected by `created_at` in the inclusive local report date
   range. Confirmed settlements affect balances according to `confirmed_at` in the
   same range; pending, rejected, and cancelled rows remain visible but have no
   balance effect.
9. Timestamp-to-date conversion uses the application's documented report timezone.
   Until room-specific timezones exist, tests assume `Asia/Bangkok` and include a UTC
   midnight-boundary fixture.
10. Aggregate money is calculated with `Decimal`, never binary floating point.
11. Every aggregate has deterministic ordering and contains stable member/category
    identifiers in addition to display labels.
12. The JSON report and workbook are generated from the same scoped report service so
    their counts and amounts cannot drift.

## Test Data

Create records independently per backend test. Use stable UUIDs and these deliberate
failure-prone fixtures:

- Room A with owner, admin, two active members, one left member, and three categories.
- Room B with similarly named members and expenses to detect cross-room leakage.
- Posted expenses on the day before, exactly on, inside, exactly on, and the day after
  the requested range.
- Draft and cancelled expenses inside the range with large amounts.
- At least two items in one posted expense, one categorized and one uncategorized.
- Equal, exact, percentage, and shares split records whose stored owed values include
  a rounding remainder.
- One member name, item title, and note containing Vietnamese Unicode.
- One title beginning with `=`, one beginning with `+`, and one beginning with `@` to
  detect Excel formula injection.
- Pending, confirmed, rejected, and cancelled settlements inside the range.
- Confirmed settlements just outside the range and timestamps around the
  `Asia/Bangkok` midnight boundary.
- A maximum supported VND amount close to the `Numeric(14, 2)` limit.

Expected totals must be declared explicitly in fixtures rather than recomputed with
the production aggregation function.

## Backend Service and API Scenarios

| ID | Scenario | Observable acceptance |
| --- | --- | --- |
| RPT-B01 | Aggregate a mixed range | Response identifies room and dates; posted count/total and month/category/member totals match fixture constants; every aggregate reconciles to the filtered posted total. |
| RPT-B02 | Exclude non-posted expenses | Draft and cancelled IDs and amounts are absent from every aggregate, balance, and workbook data row. |
| RPT-B03 | Inclusive expense date boundaries | Posted expenses exactly on `from_date` and `to_date` are included; records one day outside are excluded. |
| RPT-B04 | Group by month | A range crossing year-end returns ordered `YYYY-MM` buckets with no locale-string sorting error and no empty duplicate month. |
| RPT-B05 | Group items by category | Multiple items from one expense aggregate once each; deleted/null categories use `Uncategorized`; no join multiplication occurs. |
| RPT-B06 | Aggregate by member | Payer totals use whole posted expenses, owed totals use item splits, all active/historical participants remain identifiable, and net values reconcile to zero across the room. |
| RPT-B07 | Range-scoped balances | Posted expenses and confirmed settlements in range alter equal and opposite member balances; all member balances sum to zero. |
| RPT-B08 | Settlement status behavior | All in-range statuses appear in settlement history; only confirmed settlements affect sent, received, and net balance totals. |
| RPT-B09 | Settlement timezone boundary | UTC timestamps around local midnight fall into the date selected under the documented `Asia/Bangkok` rule, without a one-day shift. |
| RPT-B10 | Empty valid range | API returns `200`, zero summary values, and empty aggregate/row arrays rather than `404` or `null`. |
| RPT-B11 | Decimal and large-money safety | Decimal totals retain exact cents/VND values near the schema limit and response serialization contains no float drift or scientific notation. |
| RPT-B12 | Stable ordering | Equal-value month/category/member/settlement records return in the documented tie-break order on repeated calls. |
| RPT-B13 | Missing or invalid dates | Missing, malformed, impossible, or reversed dates return the shared `422` error envelope and do not execute an unbounded report query. |
| RPT-B14 | Unknown room | A valid token with an unknown room ID receives the existing not-found outcome without a data-shaped response. |
| RPT-B15 | Missing/invalid authentication | Missing or expired Bearer token returns `401` with the shared error envelope. |
| RPT-B16 | Room authorization | Active owner, admin, and member can read/export; invited, left, removed, and unrelated users are denied according to the room membership policy. |
| RPT-B17 | Cross-room isolation | A Room A request never contains Room B IDs, names, amounts, categories, members, or settlements, even when dates and labels overlap. |
| RPT-B18 | Archived room history | An active member can read historical reports for an archived room if read-only room policy permits it; export remains read-only and cannot create or change accounting records. |
| RPT-B19 | API response schema | Decimal strings, ISO dates/timestamps, IDs, display labels, aggregate arrays, balance rows, and settlement rows conform to the report response model. |
| RPT-B20 | No side effects | Calling JSON report and export endpoints does not mutate expenses, settlements, activity history, or timestamps. Re-fetch through public APIs proves records are unchanged. |

Backend tests should cover the report service/repository with isolated records and
add FastAPI endpoint tests for query validation, authorization, headers, and error
envelopes. If month grouping uses PostgreSQL-specific SQL, run those query tests
against PostgreSQL rather than relying only on the current SQLite test fixture.

## Excel Workbook Contract

The export response must:

- Return `200` with MIME type
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Set `Content-Disposition` to an attachment with a sanitized filename containing
  the room name and date range.
- Open successfully as an OOXML workbook, not merely have an `.xlsx` extension.
- Contain sheets in this order:
  `Summary`, `Expenses`, `Items`, `Splits`, `Balances`, `Settlements`.
- Use numeric Excel cells for monetary and quantity values and real Excel date/time
  cells for dates, with stable number/date formats.
- Export values rather than executable formulas for user-controlled text.
- Preserve Vietnamese Unicode and long room/member/item names.
- Include a header row, freeze pane, and filterable tabular headers for data sheets.
- Avoid internal storage paths, access tokens, emails not required by the report, and
  other private implementation metadata.

### Workbook Columns

| Sheet | Required columns/content |
| --- | --- |
| `Summary` | Room ID/name, inclusive from/to dates, report timezone, generated timestamp, posted expense count/total, member count, confirmed settlement count/amount, and aggregate reconciliation values. |
| `Expenses` | Expense ID/date/title, payer member ID/name, total, note, posted timestamp. |
| `Items` | Expense ID/date, item ID/position/name, category ID/name, quantity, unit price, item total. |
| `Splits` | Expense ID, item ID/name, member ID/name, split method, share value, amount owed. |
| `Balances` | Member ID/name, paid, owed, confirmed sent, confirmed received, net balance. |
| `Settlements` | Settlement ID, created/confirmed timestamps, sender/receiver IDs and names, amount, method, status, reference, note. |

## Workbook Validation Scenarios

Parse response bytes with an independent reader such as `openpyxl`; do not validate
the workbook using the same library/API that produced it.

| ID | Scenario | Observable acceptance |
| --- | --- | --- |
| XLS-B01 | Validate download envelope | Status, MIME type, attachment filename, non-empty body, and ZIP/OOXML signature are correct. |
| XLS-B02 | Open workbook and inspect sheets | Reader opens without repair warnings; exactly six required sheets exist in the specified order. |
| XLS-B03 | Reconcile JSON and workbook | Summary values, data row counts, IDs, date bounds, and money totals equal the JSON report for the same room/range. |
| XLS-B04 | Validate filtered rows | Boundary rows are present; outside-range, draft, cancelled, and foreign-room expenses are absent from all expense-related sheets. |
| XLS-B05 | Validate relational rows | Item and split rows point to exported expense/item IDs; no duplicates are introduced by category/member joins. |
| XLS-B06 | Validate cell types and formats | Money/quantity cells are numeric, date cells are dates, IDs remain text, VND formatting is readable, and large values preserve precision. |
| XLS-B07 | Validate formula injection safety | User text beginning with `=`, `+`, `-`, or `@` is stored as literal text and no user-controlled cell has formula data type. |
| XLS-B08 | Validate Unicode and long text | Vietnamese and long labels round-trip exactly without replacement characters, truncation, or invalid sheet names. |
| XLS-B09 | Validate empty workbook | A valid empty range still returns all sheets, headers, zero summary values, and no phantom data rows. |
| XLS-B10 | Validate settlement/balance rules | Every settlement status is exported, only confirmed in-range settlements affect balance columns, and balance totals sum to zero. |
| XLS-B11 | Validate usability metadata | Header rows, freeze panes, filters, column widths, and money/date number formats are present without merged cells blocking tabular filtering. |
| XLS-B12 | Validate privacy | Workbook does not contain Bearer tokens, storage paths, password/session data, unrelated user emails, or Room B fixture values. |

## Reports Page Scenarios

Page tests mock HTTP/auth boundaries with MSW and assert visible outcomes and outgoing
requests. Do not mock React Query state, report calculations, or form controls.

| ID | Viewport | Scenario | Observable acceptance |
| --- | --- | --- | --- |
| RPT-P01 | 390x844 | Initial load | Page has an accessible `Reports` heading, room select, labeled from/to date controls, apply action, export action, loading state, and no horizontal page scroll. |
| RPT-P02 | 390x844 | Default filters | First accessible room and current calendar month are selected when no valid query params exist; one report request carries matching room/from/to values. |
| RPT-P03 | 390x844 | Deep-linked filters | Valid `roomId`, `from`, and `to` query values restore controls and load exactly that report; an inaccessible room ID safely falls back without displaying its data. |
| RPT-P04 | 360x800 | Change room | Selecting another room requests only that room's report, updates visible room identity, and does not retain member/category labels from the prior room. |
| RPT-P05 | 360x800 | Apply date range | Inclusive dates are sent in ISO format, visible cards/charts/tables refresh, and the URL/query state remains shareable without an auth token. |
| RPT-P06 | 390x844 | Invalid date range | Missing or reversed dates show an associated validation message, focus the invalid control, and send no report/export request. |
| RPT-P07 | 390x844 | Summary and month results | Posted total/count and month series display server values in VND and chronological order; draft/cancelled labels do not appear as included totals. |
| RPT-P08 | 390x844 | Category results | Category names, values, and percentages are readable without relying on color alone; `Uncategorized` is represented; values reconcile to summary total. |
| RPT-P09 | 390x844 | Member results | Paid, owed, and net values identify each member clearly; positive/negative state has text/icon meaning in addition to color. |
| RPT-P10 | 390x844 | Balances and settlements | Balance rows and settlement status/history are readable; long names and large VND values do not overlap or truncate critical amounts. |
| RPT-P11 | 390x844 | Export success | Clicking export sends the currently visible room/date filters once, indicates download progress, uses the server filename, and creates one `.xlsx` download. |
| RPT-P12 | 390x844 | Export duplicate prevention | While download is pending, export is disabled or busy and repeated taps do not start duplicate requests. |
| RPT-P13 | 390x844 | Export error | JSON `401/403/422/5xx` or network failure does not download a corrupt blob; user sees a recoverable message and current report remains visible where appropriate. |
| RPT-P14 | 390x844 | Empty report range | Zero summary and a helpful no-data state appear; filters remain usable and export remains available for a header-only workbook. |
| RPT-P15 | 390x844 | No rooms | Page explains that a room is required and links to room creation/list; report and export endpoints are not called. |
| RPT-P16 | 390x844 | Initial report error/retry | Error state distinguishes load failure from no data; retry repeats the same room/date request and replaces the error on success. |
| RPT-P17 | 390x844 | Authorization errors | `401` follows the existing session recovery/login behavior; `403` explains missing room access and never renders stale cached report data. |
| RPT-P18 | 390x844 | Rapid filter changes | A slower stale request cannot overwrite the newest selected room/date result; export always uses the currently rendered filter state. |
| RPT-P19 | 390x844 | Keyboard and screen reader | Controls have role/name/state, focus order follows visual order, charts have textual summaries, and export busy/error state is announced. |
| RPT-P20 | 390x844 and 1440x900 | Navigation entry | Authenticated desktop menu and mobile drawer expose a `Reports` entry to `/reports`; the room dashboard exposes a room-scoped report link; navigation closes the mobile drawer. |

## Responsive and Real-Browser Matrix

JSDOM page tests cannot prove geometry or chart rendering. After the page skeleton
exists, run `testskill.page-analyzer`, then perform these browser checks:

| Viewport/browser | Required checks |
| --- | --- |
| 320x568 Chromium | Smallest supported width; filters stack; no body overflow; totals wrap safely; 44px touch targets; export remains reachable above fixed navigation. |
| 360x800 Chromium | Android baseline; room/date controls, cards, category/member rows, and settlement rows remain usable with long labels. |
| 390x844 WebKit | iPhone baseline; safe-area and bottom navigation spacing; native date picker and downloaded file flow remain operable. |
| 440x956 Chromium | Regression width from prior mobile issue; select portals and date controls remain within the report card/viewport. |
| 768x1024 Chromium/WebKit | Tablet reflow; two-column summary/filter layouts do not create clipped charts or disconnected labels. |
| 1440x900 Chromium | Desktop navigation, multi-column report composition, keyboard focus order, and readable maximum line lengths. |

At every viewport:

- Assert `document.documentElement.scrollWidth <= clientWidth`.
- Data tables may scroll inside a labeled region, but must not widen the body.
- Charts resize without clipped axes, labels, legends, or inaccessible hover-only
  values; equivalent textual values remain available.
- Long Vietnamese names and maximum VND values do not overlap controls.
- Date controls, room select, apply, reset, and export have visible focus and at
  least 44px touch targets on mobile.
- Loading, empty, error, and populated states preserve page structure and fixed-nav
  clearance.
- Check portrait first and one 568x320 landscape smoke case.
- Check 200% zoom/reflow and light/dark theme contrast.

## Suggested Test File Placement

After `page-analysis.md` exists:

- `frontend/features/reports/components/reports-page.test.tsx`
  for page outcomes with MSW.
- `frontend/components/navbar.test.tsx` only if the shared navigation behavior cannot
  be covered adequately from the reports page.
- `backend/tests/reports/test_service.py` for isolated report accounting rules.
- `backend/tests/reports/test_router.py` for auth, validation, headers, and errors.
- `backend/tests/reports/test_workbook.py` for independent `.xlsx` parsing and
  workbook safety.

Prefer page tests over hook/client unit tests. Do not unit-test simple query keys,
Axios wrappers, React state, chart-library internals, or CSS class names.

## Definitions of Done

- Every backend report aggregate reconciles exactly to independently declared fixture
  totals and excludes drafts, cancelled expenses, out-of-range rows, and other rooms.
- Authorization is enforced identically for JSON report and Excel export.
- Date boundary and timezone tests pass without off-by-one errors.
- Reports page covers populated, empty, no-room, loading, validation, authorization,
  server, network, retry, and stale-response states.
- Excel export opens successfully and all six sheets pass schema, type, amount,
  relationship, formula-injection, Unicode, and privacy checks.
- Mobile browser checks pass at 320, 360, 390, and 440 pixel widths with no body
  overflow or hidden primary action.
- Reports are discoverable from authenticated desktop and mobile navigation and from
  a room-scoped entry.
- Page analysis and final test verification artifacts are completed in the configured
  test context before the feature is accepted.

## Workflow Gates and Planning Constraints

- This planner may run before the page exists. Do not write page tests until
  `frontend/.testskill/2026-08-09-expense-reports-excel/page-analysis.md` exists.
- `stop_when_no_page_analysis = true`; a failed/missing analysis blocks test coding.
- The configured canonical example
  `frontend/.testskill/examples/page.test.tsx` is missing.
- `frontend/package.json` has no `test` script, so the configured `npm run test`
  command and a frontend coverage baseline are currently unavailable.
- No production page or endpoint exists yet, so runtime DOM/network inspection is
  intentionally deferred until a page skeleton is implemented.
- Finish implementation with the test verifier and write the configured
  `test-result.md`.

