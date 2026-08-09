# Expense Creation Mobile Responsiveness Test Plan

## Planning Metadata

- Context root: `frontend`
- Target route: `/expenses/new`
- Follow-on route: `/expenses/new/split?expenseId={id}`
- Primary regression viewport: `440x956`
- Test framework: Vitest + React Testing Library
- Network interception: Mock Service Worker
- Human plan review required: No

## Objective

Verify that the expense creation flow remains usable and visually contained on
mobile screens, with particular attention to the custom room and payer selects.
Opening or changing a select must not introduce horizontal page scrolling,
clip the active control, overlap unrelated fields, or prevent the user from
continuing the flow.

## Source Evidence

- `features/expenses/components/expense-create-page.tsx` renders Radix-backed
  selects for `Phòng` and `Người đã trả`.
- The room select uses a full-width control inside a padded card.
- The payer select shares a responsive grid with the expense date.
- `features/expenses/components/expense-item-editor.tsx` renders member rows
  with fixed-width split inputs that can compete with member names on narrow
  screens.
- The supplied Windows/Chrome screenshot shows the open room select looking
  detached from its rounded card and extending across the available mobile
  content at approximately 440px.

## Scope

- Step 1 expense details at 320px, 360px, 390px, and 440px widths.
- Closed and open room and payer custom selects.
- Long room names and long member display names.
- Reflow from one-column mobile layout to the existing two-column breakpoint.
- Step 2 member rows for equal, exact, percentage, and shares methods.
- Regression protection for room selection, member loading, and draft submit.

## Out of Scope

- Pixel-perfect matching of operating-system popup chrome.
- Production code changes.
- Expense reporting or Excel export.
- Backend persistence behavior beyond mocked request contracts.

## Definitions of Done

- `document.documentElement.scrollWidth` never exceeds
  `document.documentElement.clientWidth` at the tested mobile widths.
- Every closed select and input stays fully inside its card and viewport.
- Room and payer controls have a minimum 44px touch target and a visible focus
  state.
- Opening a custom select keeps the page stable: no layout shift, field
  overlap, clipped selected value, or accidental horizontal scroll.
- Long selected labels remain readable or truncate within the control without
  widening the page.
- Choosing a room refreshes the available payer members for that room.
- Choosing a payer and submitting still sends the selected room/member IDs.
- Step 2 member rows retain the member identity, selection control, amount
  preview, and editable split value without horizontal overflow.

## Test Data and Simulation

Use MSW to provide:

- Two rooms: `Trọ 103` and
  `Phòng trọ tầng 3 - Khu nhà phía sau đường Nguyễn Văn Linh`.
- At least four active members, including
  `Trần Nguyễn Hoàng Phúc - Người thanh toán chính`.
- A room switch whose members differ from the initially selected room.
- A successful draft response with a stable expense ID.

Mock only HTTP and authentication boundaries. Do not mock React state,
responsive hooks, or form controls.

## Acceptance Scenarios

| ID | Viewport | Scenario | Observable acceptance |
| --- | --- | --- | --- |
| EMR-01 | 440x956 | Load step 1 with a normal room and member | Header, progress indicator, card, both selects, money input, file input, and actions fit without horizontal scrolling. Both selects remain inside the card. |
| EMR-02 | 440x956 | Open the room select and choose another room | The page dimensions do not change, the control remains anchored in its field, all options are selectable, the chosen label fits the closed control, and the payer options refresh from the selected room response. |
| EMR-03 | 440x956 | Open the payer select with a long member name | The portaled popup remains operable, no unrelated field is covered after closing, the selected value stays within the control, and the date field remains aligned below or beside it according to the breakpoint. |
| EMR-04 | 320x568 and 360x800 | Repeat room and payer selection at narrow widths | The form remains single-column, no control has a negative or off-screen bounding edge, labels remain associated with controls, and all interactive targets are at least 44px high. |
| EMR-05 | 390x844 | Fill valid details after switching rooms and save/continue | The draft request contains the visible room ID and payer member ID, formatted money is sent as a raw number, and the success route is correct. Responsive fixes do not alter form behavior. |
| EMR-06 | 320x568 and 440x956 | On step 2, switch through equal, exact, percentage, and shares | Each member row fits the viewport; long names do not push split inputs off-screen; selection, preview, and value input remain usable; the page has no horizontal scroll. |
| EMR-07 | 440x956, then 768x1024 | Resize/orient while a long room/member is selected | The selected values survive reflow, mobile content does not retain stale fixed widths, and the payer/date section adopts the intended breakpoint layout without overlap. |
| EMR-08 | 440x956 | Keyboard through both selects and action buttons | Focus order follows the visual order, labels/names are announced, Space/Enter opens each select, Escape closes it where supported, and focus remains visible. |

## Automated Page-Test Plan

Create a page test after `page-analysis.md` exists:

1. Render `/expenses/new` with MSW room and member fixtures.
2. Assert `Phòng` and `Người đã trả` are discoverable by accessible role and
   name.
3. Select the long-name room and verify the room-detail request and refreshed
   payer options.
4. Select the long-name payer, submit the form, and verify the draft request
   payload and navigation outcome.
5. Keep layout assertions out of JSDOM; it does not calculate actual element
   geometry or render the portaled popup visually.

## Real-Browser Responsive Check

Run the flow in Windows Chrome, matching the supplied reproduction
environment. At each mobile viewport:

1. Compare root `scrollWidth` and `clientWidth`.
2. Inspect bounding rectangles for the card, both selects, the file input, and
   action buttons.
3. Open each custom select, capture the open and closed states, select the
   longest option, and repeat after scrolling.
4. Repeat step 2 with exact and percentage member split controls.
5. Confirm there are no console errors while switching rooms or resizing.

The reliable gate is containment, page stability, readability, keyboard
behavior, and successful selection rather than an exact visual snapshot.

## Browser Matrix

- Windows Chrome at `440x956` (primary screenshot regression).
- Chromium mobile emulation at `390x844`.
- Chromium at `360x800` and `320x568`.
- Tablet breakpoint at `768x1024`.
- Safari/WebKit mobile smoke check when available.

## Workflow Gates

- Do not write tests until `page-analysis.md` has been created; the config has
  `stop_when_no_page_analysis = true`.
- Run the configured test command only after a valid test script/harness exists.
  The current `package.json` does not define `npm run test`.
- Run the test verifier after implementation and record the result in
  `test-result.md`.

## Planning Constraints

- The configured canonical example
  `.testskill/examples/page.test.tsx` is absent.
- The frontend package currently has no test script or existing page-test
  files, so no coverage baseline can be measured during planning.
- These constraints do not block this plan, but they must be resolved before
  automated test implementation and verification.
