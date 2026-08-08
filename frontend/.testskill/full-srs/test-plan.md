# Bill Mates Full SRS Test Plan

## 1. Purpose

Define the mobile-first acceptance test coverage for the Bill Mates MVP described in
`docs/SRS_Room_Expense_Manager_v1.0.docx`.

The primary test type is a page test using Vitest, React Testing Library, and Mock
Service Worker (MSW), as configured by `frontend/testskill.config.toml`. Each page
test covers one meaningful user action and asserts only user-visible outcomes,
outgoing API mutations, navigation boundaries, or persisted browser state.

Unit tests are reserved for high-combination split and balance calculation
algorithms. No unit tests are planned for forms, hooks, API wrappers, or simple UI
components when the behavior can be proven through a page test.

## 2. Planning Gates

- Human review is not required by the current testskill configuration.
- Before writing tests for a page, create its `page-analysis.md`.
- Do not implement a page test until the page skeleton and accessible controls exist.
- Use the configured canonical example once
  `frontend/.testskill/examples/page.test.tsx` exists; it is currently missing.
- Finish implementation sessions with the configured verifier and
  `test-result.md`.
- Do not treat current local-state or timeout simulations as accepted behavior.
  API-backed persistence is required by the SRS.

## 3. Test Architecture

### 3.1 Page test defaults

- Render the route-level page with production providers and router adapters.
- Mock FastAPI and Supabase Auth/Storage boundaries with MSW or the narrowest
  equivalent boundary.
- Prefer accessible queries by role, label, and visible name.
- Assert VND values using `vi-VN` formatting.
- Assert request method, URL, authorization presence, and meaningful request fields
  for every mutation.
- Stop the test after navigation is requested; the destination page is tested
  separately.
- Cover success, loading, empty, recoverable API error, validation error, and
  unauthenticated/unauthorized outcomes where applicable.
- Use deterministic IDs, dates, members, and integer minor-unit money fixtures.

### 3.2 API contract sources

Current auth and profile contracts:

- Supabase Auth SDK: password/OAuth login, registration, recovery, refresh, and logout
- `GET /api/v1/auth/me`
- `GET/PATCH /api/v1/me`
- `GET/POST /api/v1/me/payment-accounts`
- `GET /api/v1/rooms`
- `POST /api/v1/rooms`
- `GET /api/v1/rooms/{room_id}`
- `POST /api/v1/rooms/{room_id}/members`
- `GET /api/v1/expenses?room_id={room_id}`
- `POST /api/v1/expenses`
- `POST /api/v1/expenses/ocr`
- `GET /api/v1/debts?room_id={room_id}`
- `POST /api/v1/debts/settle`

Target SRS contracts that page tests must drive as their pages are implemented:

- `PATCH /api/v1/rooms/{room_id}`
- room archive, member role/status, leave/remove, invite creation, and invite join
- room category CRUD and payment account CRUD/default selection
- room-scoped expense listing with filters and pagination
- expense draft detail/update, item CRUD, item split update, post, cancel, and detail
- receipt upload metadata, signed upload/access URLs, deletion, and OCR status
- balances and settlement suggestions
- settlement create, confirm, reject, cancel, proof upload, and history
- room activity log listing with filters and pagination

Until backend route names are finalized, tests should centralize target paths in MSW
handlers instead of duplicating string literals throughout page tests.

## 4. Core Fixtures

- Users: owner, admin, active member, invited member, removed member, outsider.
- Room: `room-101`, VND, three active members, one pending invite.
- Expense draft: `expense-draft-1`, payer owner, total 200,000 VND.
- Posted itemized expense:
  - Fried chicken: 120,000 split 40,000/40,000/40,000.
  - Coca: 30,000 split 15,000/15,000 between owner and admin.
  - Fries: 50,000 owed entirely by member.
  - Member totals: 55,000/55,000/90,000.
- Settlement: member pays owner 150,000 by bank transfer, initially pending.
- Receipt states: valid image, invalid MIME, oversized image, upload failure, OCR
  pending, processing, completed, and failed.
- API errors use the SRS envelope: `code`, `message`, `details`, `request_id`.

## 5. Page-First Coverage

### 5.1 Public landing and authentication

Routes: `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password`,
`/auth/reset-password`, plus legacy redirects `/login`, `/register`,
`/forgot-password`, and `/reset-password`.

#### AUTH-P01 - Landing page

- Guest sees sign-in and registration actions without authenticated navigation.
- Authenticated user sees the application entry action and account menu.
- Primary actions request navigation to the correct auth or room route.
- Auth session loading has a stable, labeled progress state without layout collapse.

#### AUTH-P02 - Login

- Valid email/password calls the Supabase password sign-in boundary once,
  stores/refreshes the authenticated session, and requests navigation to `/rooms`.
- Invalid credentials display the server message inline and preserve the email.
- Client validation prevents malformed email or empty password requests.
- Pending submission disables duplicate submits and exposes a loading label.
- Network or 5xx failure presents a retryable error without clearing the form.

#### AUTH-P03 - Registration

- Valid name, email, password, and confirmation call the Supabase sign-up boundary
  with no confirmation field leakage.
- Successful registration shows the correct verification or signed-in outcome and
  requests the expected navigation.
- Duplicate email and weak password details are presented next to the relevant field.
- Password mismatch and invalid email do not send a request.

#### AUTH-P04 - Forgot and reset password

- Forgot-password calls the Supabase recovery boundary and shows a non-enumerating
  success message.
- Invalid email is rejected locally; server/network failure is recoverable.
- Reset page handles valid, expired, missing, and malformed recovery sessions.
- Valid matching passwords update the account through the finalized auth contract,
  clear the recovery state, and request navigation to login.

#### AUTH-P05 - Session boundaries

- Protected pages render a loading boundary while session validation is pending.
- Missing/expired session requests navigation to login without exposing room data.
- A 401 from an API-backed protected page triggers one session recovery or logout
  path, not an infinite request loop.
- Logout clears the session and requests navigation to the public/login route.

### 5.2 Rooms and members

Routes: `/rooms`, `/rooms/{id}`, plus target invite/member management views.

#### ROOM-P01 - Room list

- Loading shows room-list skeletons or labeled progress.
- `GET /api/v1/rooms` success renders room name, role, member count, total expense,
  and clearly worded pay/receive/settled balance.
- Empty response renders the first-room call to action.
- Error response renders retry; retry replaces the error with server data.
- Creating a room submits `POST /api/v1/rooms` with name, description/address, and
  currency as finalized, then inserts or refetches the API-created room.
- Invalid/blank names never send a request; pending create prevents duplicates.
- Refresh persistence is an acceptance requirement: the room must come from the API,
  not React state or local storage.

#### ROOM-P02 - Room dashboard

- `GET /api/v1/rooms/{id}` renders room identity, current user's role, members,
  summary balances, recent expenses, and pending settlements.
- Recent expenses show draft/posted/cancelled status without draft/cancelled amounts
  affecting debt summaries.
- Empty expense and settlement sections show useful calls to action.
- Unknown room, forbidden membership, and archived room have distinct outcomes.
- Add-expense, balances, members, and history actions request room-scoped navigation.

#### ROOM-P03 - Invite and join

- Owner/admin creates an invite with optional email, expiry, and maximum uses.
- Successful invite displays a shareable link/code and copy confirmation.
- Member without permission cannot see or activate invite creation.
- Join page accepts a valid token and submits the join API once.
- Expired, revoked, exhausted, email-mismatched, and already-active invitations
  display specific non-destructive outcomes.

#### ROOM-P04 - Member management

- Member list renders nickname, role, and status from the API.
- Owner can change allowed roles; outgoing mutation identifies room, member, and role.
- Admin cannot promote to owner or perform owner-only operations.
- Leave is blocked when business rules report unresolved debt.
- Remove changes status rather than deleting history and asks for confirmation.
- Optimistic UI, if used, rolls back and announces an API failure.

#### ROOM-P05 - Room settings and categories

- Authorized user updates room name, description, and currency with `PATCH`.
- Owner can archive only after confirmation; archived state disables new expense data.
- Category list supports create, edit, and deactivate with room-scoped requests.
- Duplicate category, forbidden role, and API failure remain recoverable.

### 5.3 Draft and itemized expenses

Routes: `/expenses/new`, `/expenses/new/split`, `/expenses/new/confirm`, and target
room-scoped draft/detail/history routes.

#### EXP-P01 - Create or resume draft

- The first valid general-information submit creates an API draft with room, payer,
  date, title, total, and `status=draft`.
- The payer and creator must be active members returned by the selected room.
- API-created draft ID is persisted for successor steps; refresh reloads the draft
  from the API.
- Existing draft data repopulates fields and can be safely edited.
- Draft save loading, validation, 401/403, conflict, and network errors are visible.
- Draft creation and edits do not alter balances.

#### EXP-P02 - Whole-bill split

- Choosing whole-bill mode creates one item whose total equals the expense total.
- Equal, exact, percentage, and shares methods expose only their relevant inputs.
- At least one active room member is required.
- Advancing sends the item and split contract to the API and requests navigation only
  after success.

#### EXP-P03 - Itemized editor

- User can add, edit, duplicate, reorder if supported, and remove multiple items.
- Each item accepts name, quantity, unit price, discount, surcharge, and category.
- Calculated item total is displayed in VND and is traceable to the entered fields.
- Every item independently selects participating room members and one split method.
- The 200,000 VND three-item fixture displays item totals and member totals exactly.
- Duplicate member split, outsider member, foreign-room category, negative amount,
  and zero participant errors are attached to the affected item.
- Saving sends item mutations against the persisted draft, not session-only state.

#### EXP-P04 - Equal split acceptance

- 100,000 VND split across three stable members yields integer allocations totaling
  exactly 100,000.
- The rounding remainder is assigned deterministically by stable member order.
- Rerender, refresh, and repeated preview produce the same allocations.
- Removing or adding a participant recalculates the preview and still preserves the
  exact item total.

#### EXP-P05 - Exact, percentage, and shares acceptance

- Exact values must sum to the item total; under/over totals block continuation and
  display the difference.
- Percentage values must total 100; 20/30/50 produces the corresponding owed values.
- Shares must all be greater than zero; 1/1/2 produces 25/25/50.
- Decimal input is normalized without binary floating-point drift.
- A member appears only once per item and all final owed values sum to item total.

#### EXP-P06 - Confirm and post

- Confirmation reloads the server draft and shows payer, date, total, every item,
  each participant, split method, receipt state, and owed amount.
- Post submits once to `POST /api/v1/expenses/{expense_id}/post`.
- Successful post shows confirmation, clears only the completed local draft pointer,
  and requests navigation to expense detail or the room dashboard.
- Item-total mismatch, split-total mismatch, invalid member/category, or stale draft
  keeps the user on the page and links the error to the editable step.
- Refresh after success shows persisted posted data and updated balances.

#### EXP-P07 - Expense detail, filters, and cancellation

- Detail page renders payer, status, item breakdown, member owed amounts, receipts,
  and relevant activity history.
- Room expense history filters by date, payer, category, status, and keyword and sends
  pagination/filter parameters to the API.
- No results differs from initial empty history.
- Authorized cancellation requires confirmation, records the API mutation, changes
  status to cancelled, and removes the expense's debt effect.
- Forbidden edits/cancellation are absent or disabled and server 403 remains handled.

### 5.4 Receipts and OCR

Receipt coverage belongs to the create/edit expense page rather than isolated
component tests.

#### REC-P01 - Upload receipts

- Mobile user can invoke camera capture or file selection and select multiple images.
- Valid image previews filename/thumbnail, size, and upload progress.
- Upload follows the finalized signed URL or backend upload contract, then persists
  receipt metadata against the draft expense.
- Completed upload exposes a controlled/signed preview, never a public storage path.
- Invalid MIME, oversized file, duplicate file, upload failure, metadata failure, and
  expired signed URL produce actionable outcomes.
- Removing a receipt asks for confirmation and removes object plus metadata only
  after API success.

#### REC-P02 - OCR state machine

- Not requested offers OCR without blocking manual entry.
- Pending and processing show persistent progress and prevent duplicate OCR requests.
- Completed OCR presents merchant, total, and item suggestions for user review.
- User can accept selected OCR fields, edit them, or reject all without posting.
- OCR data never overwrites dirty user fields without explicit confirmation.
- Failed OCR preserves the image and manual data and offers retry.
- Polling or refetch behavior stops on completed/failed and on page unmount.

### 5.5 Balances and settlements

Routes: `/debts`, `/debts/settle`, plus target room-scoped balance and settlement
history/detail views.

#### BAL-P01 - Balance summary

- API data renders every member as "needs to receive", "needs to pay", or "settled";
  the UI does not rely on unexplained positive/negative signs.
- Totals include only posted expenses and confirmed settlements.
- Draft/cancelled expenses and pending/rejected/cancelled settlements have no balance
  effect.
- Suggestions identify sender, receiver, and exact VND amount and conserve net zero.
- Loading, zero-balance empty, partial data error, full error, and retry are covered.

#### BAL-P02 - Consistency acceptance

- For each member, displayed balance matches:
  `paid_for_posted - owed_from_splits + confirmed_sent - confirmed_received`.
- The sum of all room balances equals zero after deterministic rounding.
- Posting the 200,000 fixture updates the payer and participant balances exactly once.
- Confirming a 150,000 settlement updates both members by equal and opposite amounts.
- Refresh produces the same balances from the API.

#### SET-P01 - Create pending settlement

- Selecting a suggestion opens a room-scoped settlement form with sender, receiver,
  amount, payment method, and receiver account/QR.
- Copy account number/content produces a visible confirmation.
- Valid submit posts a pending settlement once; pending status does not change debt.
- Sender and receiver must differ, belong to the room, and amount must be positive.
- Proof upload uses the same private-storage and failure guarantees as receipts.

#### SET-P02 - Confirm, reject, or cancel settlement

- Recipient can confirm a pending settlement after a confirmation prompt.
- Successful confirmation changes status and visibly refreshes balances.
- Recipient can reject with a required reason; rejection does not affect balances.
- Authorized actor can cancel only from allowed statuses.
- Controls reflect role/status permissions and remain safe under stale-state conflict.

#### SET-P03 - Settlement history

- History renders sent/received direction, counterpart, amount, method, status, proof,
  and timestamps.
- Filters and pagination are represented in the API request.
- Empty, no-results, loading, error, and signed-proof URL expiry are handled.

### 5.6 Activity history and profile

Target history route plus existing `/profile`.

#### HIST-P01 - Room activity history

- Activity list renders actor, action, entity, timestamp, and a readable summary of
  important old/new values.
- Filters for actor, action, entity, and date update API parameters and visible rows.
- Pagination retains active filters.
- Posted edits/cancellations and settlement status changes appear after refetch.
- Empty, no-results, loading, error, retry, and forbidden states are distinct.

#### PROF-P01 - Profile

- `GET /api/v1/users/me` renders display name, email, phone, avatar, and verification
  state.
- Editing profile submits only changed allowed fields through `PUT /api/v1/users/me`.
- Successful update refreshes visible profile/session identity.
- Avatar upload validates type/size and persists private storage metadata.
- Validation and API errors preserve unsaved form values.

#### PROF-P02 - Payment accounts and preferences

- User can add bank/e-wallet details, edit them, and set one default receiving account.
- Sensitive input is not written to unsafe browser storage or query strings.
- Settlement pages use the recipient's current default account.
- Theme preference persists across refresh and remains readable in both themes.
- Logout pending/error/success states remain accessible and prevent duplicate action.

## 6. Shared Loading, Error, Empty, and State Tests

These scenarios should be included in the relevant page files, not duplicated into
generic implementation-detail tests.

- Initial loading provides an accessible label and keeps primary layout stable.
- Mutation loading disables only conflicting actions and prevents duplicate requests.
- Empty state explains what is empty and offers the next allowed action.
- Filtered no-results state offers filter reset without implying no data exists.
- API errors display the server message safely, include a retry where meaningful, and
  never render raw stack traces or secret data.
- 401 requests authentication recovery; 403 explains missing permission; 404
  distinguishes missing resource; 409 handles stale/conflicting data; 422 maps field
  details; 429 communicates retry; 5xx/network failures preserve user input.
- Successful retries replace stale error/loading content.
- Slow free-tier cold starts remain visibly loading and do not trigger duplicate
  mutations.

## 7. Mobile Navigation and Responsive Checks

### 7.1 Page tests

- At mobile layout, bottom navigation exposes Rooms, Debts, Add Expense, and Profile
  with one active destination.
- Auth routes do not render application bottom navigation.
- Activating a nav item requests the expected route.
- Authenticated account trigger opens a keyboard-operable mobile sheet; close,
  backdrop, navigation, and logout work.
- Fixed bottom navigation does not cover the last actionable control; pages reserve
  safe-area and scroll space.
- Dialogs/sheets trap and restore focus, close with Escape where applicable, and have
  accessible names.

### 7.2 Browser verification matrix

Run lightweight browser smoke checks after page tests pass:

| Viewport/browser | Required checks |
| --- | --- |
| 360x800 Chromium | Small Android layout, no horizontal overflow, 44px touch targets, keyboard does not hide submit controls |
| 390x844 WebKit | iPhone safe-area spacing, camera/file input, fixed navigation, sheets and dialogs |
| 768x1024 WebKit/Chromium | Tablet stacking, item editor usability, receipt preview, no clipped totals |
| 1440x900 Chromium | Desktop navigation, multi-column room/debt layouts, dialogs, focus order |
| 1440x900 Firefox | Form controls, sticky/fixed UI, number/date/file inputs, overflow and wrapping |

For each browser check:

- Verify login, open room, create/resume draft, edit one item split, upload receipt,
  inspect balances, create pending settlement, and open profile/history.
- Verify portrait mobile first, then one landscape rotation for expense editing.
- Verify 200% zoom/reflow on critical forms.
- Verify keyboard-only completion of auth, room creation, expense split, and
  settlement confirmation.
- Verify light and dark themes, long Vietnamese names, large VND values, slow API,
  offline/reconnect, and refresh consistency.
- Record visual regressions for overlap, clipped text, hidden controls, unsafe-area
  collision, and horizontal scrolling.

## 8. Unit Tests: Heavy Algorithms Only

Create unit tests only if these calculations exist as pure reusable frontend
functions for immediate preview. The backend remains authoritative, so page tests
must still assert server-returned allocations and balances.

### UNIT-SPLIT-01 - Equal allocation and deterministic remainder

- Zero/one/many participant boundaries.
- 100,000 across three members totals exactly 100,000.
- Stable member ordering receives remainder deterministically.
- Reordering with an explicitly stable key does not produce accidental drift.
- Large VND values remain within supported numeric bounds.

### UNIT-SPLIT-02 - Exact, percentage, and shares

- Exact sum equality and under/over difference.
- Percentage sum exactly 100, including decimal percentages.
- Shares require positive values and allocate 1/1/2 as 25/25/50.
- All methods conserve the item total after rounding.
- Invalid, duplicate, negative, empty, and malformed inputs return typed validation
  outcomes rather than `NaN` or partial allocations.

### UNIT-BAL-01 - Balance derivation

- Formula combines posted paid/owed and confirmed sent/received correctly.
- Draft/cancelled expenses and non-confirmed settlements are excluded.
- Each transaction changes two members by equal and opposite amounts.
- All room member balances sum to zero.
- Empty room, all-settled room, multiple payers, and high-volume fixtures are stable.

### UNIT-BAL-02 - Settlement minimization

- Suggestions settle all non-zero balances and conserve total value.
- No self-settlement, zero/negative transfer, or outsider member is produced.
- Deterministic input yields deterministic suggestions.
- Already-settled and single-member rooms return no suggestions.
- Complex creditor/debtor sets complete without mutating input data.

Do not add unit tests for route components, React Query wrappers, API clients, simple
formatters, local state setters, or styling.

## 9. SRS Acceptance Traceability

| SRS acceptance | Primary planned coverage |
| --- | --- |
| AC-01 room plus two invitees | ROOM-P01, ROOM-P03, ROOM-P04 |
| AC-02 200,000 itemized expense | EXP-P03, EXP-P06, BAL-P02 |
| AC-03 equal 100,000/3 | EXP-P04, UNIT-SPLIT-01 |
| AC-04 percentage 20/30/50 | EXP-P05, UNIT-SPLIT-02 |
| AC-05 shares 1/1/2 | EXP-P05, UNIT-SPLIT-02 |
| AC-06 item total mismatch rejected | EXP-P06 |
| AC-07 outsider split rejected | EXP-P03, EXP-P06 |
| AC-08 valid private receipt upload | REC-P01 |
| AC-09 pending then confirmed settlement | SET-P01, SET-P02, BAL-P02 |
| AC-10 mobile/desktop refresh consistency | ROOM-P01, EXP-P01, EXP-P06, BAL-P02, browser matrix |

## 10. Suggested Implementation Order

1. Authentication and protected-route page analyses/tests.
2. Room list, room dashboard, invite, and member page analyses/tests.
3. Draft expense, item editor, split, receipt/OCR, confirm, and detail analyses/tests.
4. Balance, settlement, history, and profile page analyses/tests.
5. Heavy algorithm unit tests only where pure preview algorithms exist.
6. Responsive/browser matrix and final verifier report.

The MVP is accepted only when refreshes source persisted API data, draft and cancelled
records do not affect balances, posted expenses and confirmed settlements affect
balances exactly once, and all core flows remain usable at the smallest supported
mobile viewport.
