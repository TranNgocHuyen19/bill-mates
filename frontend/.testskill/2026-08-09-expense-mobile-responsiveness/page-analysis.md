# Expense Creation Page Analysis

## Analysis Metadata

- Context root: `frontend`
- Primary route: `/expenses/new`
- Follow-on route: `/expenses/new/split?expenseId={id}`
- Source analyzed:
  - `features/expenses/components/expense-create-page.tsx`
  - `components/ui/select.tsx`
  - `features/expenses/components/money-input.tsx`
  - `components/ui/input.tsx`
  - `components/ui/button.tsx`
  - `components/navbar.tsx`
  - `app/expenses/new/split/page.tsx`
  - `features/expenses/components/expense-item-editor.tsx`
  - Expense and room API/query modules
- Test plan: `.testskill/2026-08-09-expense-mobile-responsiveness/test-plan.md`
- Analysis date: 2026-08-09

## Runtime Inspection Status

The local application was available at `http://localhost:3000`. Both a fresh
Playwright profile and the in-app browser were redirected from
`/expenses/new` to `/auth/login` because neither browser had an authenticated
Supabase session.

Observed runtime facts:

- Redirect target: `/auth/login`
- Login page title: `Đăng nhập - Bill Mates`
- Browser console on the redirect/login page had no warnings or errors; only
  React DevTools and HMR development messages were present.
- The target page's authenticated DOM, API responses, open select state,
  bounding boxes, and console could not be observed without signing in.

The element, ARIA, request, mutation, and responsive analysis below is therefore
source-backed. A future real-browser run must repeat the geometry and network
checks with an authenticated test session.

## Page State and Data Flow

1. Read the optional `roomId` query parameter.
2. Fetch the user's rooms with `GET /api/v1/rooms`.
3. Use the selected room, requested room, or first returned room in that order.
4. Fetch room details with `GET /api/v1/rooms/{roomId}`.
5. Keep only members whose status is `active`.
6. Changing the room clears the selected payer before loading the new room's
   members.
7. Submitting creates a server-side draft.
8. If a receipt was selected, upload it only after the draft succeeds.
9. `Lưu nháp` routes to `/expenses?roomId={roomId}`; `Tiếp tục chia` routes to
   `/expenses/new/split?expenseId={expenseId}`.

Notable state behavior:

- The first room is selected automatically after the room list loads when no
  `roomId` is supplied.
- Both submit buttons are disabled while the mutation is pending, when no room
  is selected, or when the selected room has no active members.
- The payer select is cleared on every room change, preventing a member ID from
  the previous room from being submitted.
- The payer select itself remains enabled while room detail is loading and can
  temporarily contain no options.
- API errors are presented as toasts; the form has no inline server-error
  region.

## Test Plan Drift

The test plan was written against the earlier native `<select>` implementation.
The current page uses Radix selects, so references to native popup chrome and
`selectOptions` are stale. The containment, room-switching, long-label,
keyboard, payload, and viewport acceptance outcomes remain valid. Before test
implementation, treat the role-based interaction guidance in this analysis as
the current source of truth and update the plan wording if the plan itself is
revised.

## Step 1 Interactive Elements

| Element | Accessible role/name | State and behavior | Stable locator |
| --- | --- | --- | --- |
| Back link | Link, `Quay lại` | Destination is the selected room or `/rooms` | `getByRole('link', { name: 'Quay lại' })` |
| Room control | Combobox, `Phòng` | Required, controlled Radix Select; changing it clears payer | `getByRole('combobox', { name: 'Phòng' })` |
| Room option | Option, room name | Portaled inside the open listbox | `getByRole('option', { name: roomName })` |
| Expense title | Textbox, `Tên khoản chi` | Required, minimum length 1 | `getByRole('textbox', { name: 'Tên khoản chi' })` |
| Total amount | Textbox, `Tổng tiền (VND)` | Numeric keyboard hint, formatted Vietnamese separators, raw value in hidden named input | `getByRole('textbox', { name: 'Tổng tiền (VND)' })` |
| Quick zero buttons | Button, `Thêm 3 số 0` through `Thêm 6 số 0` | Disabled when amount is zero; multiplies current value | `getByRole('button', { name: 'Thêm 3 số 0' })` |
| Payer control | Combobox, `Người đã trả` | Required, controlled Radix Select populated from active room members | `getByRole('combobox', { name: 'Người đã trả' })` |
| Payer option | Option, member name | Uses nickname when present, otherwise display name | `getByRole('option', { name: memberName })` |
| Expense date | Date input, `Ngày chi` | Required; defaults from `new Date().toISOString()` | `getByLabel('Ngày chi')` |
| Note | Textbox, `Ghi chú (không bắt buộc)` | Optional | `getByRole('textbox', { name: 'Ghi chú (không bắt buộc)' })` |
| Receipt | File input, implicit label beginning `Thêm ảnh hóa đơn` | Accepts JPEG, PNG, WebP; helper claims 10 MB but no client size validation exists | `getByLabel(/Thêm ảnh hóa đơn/)` |
| Save draft | Button, `Lưu nháp` at 360px+, `Lưu` below 360px | Creates draft and routes to expense list | `getByRole('button', { name: /^(Lưu nháp|Lưu)$/ })` |
| Continue | Button, `Tiếp tục chia` | Creates draft and routes to step 2; becomes `Đang lưu...` while pending | `getByRole('button', { name: 'Tiếp tục chia' })` |

The navbar adds these conditional controls:

- Logo link named `BillMates`.
- Authenticated account trigger whose accessible name is derived from the
  visible initial and user name.
- Mobile account dialog named `Menu tài khoản`, with two buttons named
  `Đóng menu`.
- Account navigation and logout controls when the menu is open.

Tests scoped to the expense form should avoid depending on the account trigger's
user-specific accessible name.

## Select Component Semantics

The current page no longer uses native `<select>` controls. It uses the new
Radix-backed shared select:

- `SelectTrigger` is exposed as a combobox and receives its accessible name
  from the explicit `<label htmlFor>` association.
- The popup is portaled and exposed as a listbox containing options.
- `required` and `name` are passed to the Radix root. The payer's value is
  included in native form submission through Radix's form integration.
- `aria-expanded`, popup ownership, active descendant, and keyboard navigation
  are managed by Radix.
- The trigger has a 48px height and visible focus ring.
- Options have a minimum 44px height.
- Long selected values and option labels are truncated rather than allowed to
  widen their container.
- Popup width follows the trigger width and is capped at `100vw - 2rem`.
- The popup is portaled at `z-50`, so opening it should not alter card layout.

Recommended interaction sequence:

```ts
await user.click(screen.getByRole('combobox', { name: 'Phòng' }))
await user.click(screen.getByRole('option', { name: longRoomName }))
await user.click(screen.getByRole('combobox', { name: 'Người đã trả' }))
await user.click(screen.getByRole('option', { name: longMemberName }))
```

Do not use `selectOptions`; these are not native select elements. Do not locate
the portaled popup by DOM ancestry under the form.

## ARIA and Accessibility Findings

### Good Existing Semantics

- Room and payer labels explicitly target stable trigger IDs.
- Shared text and money inputs generate label associations with `htmlFor`.
- Custom select trigger/listbox/option keyboard semantics come from Radix.
- Quick-money controls have explicit action-oriented labels.
- Member-specific amount inputs in step 2 have unique labels containing the
  member display name.
- The split-page loading icon has an accessible label.
- Mobile navigation uses a modal dialog with an accessible name.
- Main action controls meet the 44px minimum touch target in the analyzed
  classes.

### Accessibility Gaps to Cover or Flag

| Area | Finding | Testing implication |
| --- | --- | --- |
| Progress indicator | Three decorative bars have `aria-label` on a generic `div`, but no `progressbar`, `aria-valuenow`, step list, or current-step semantics | Do not assert progress semantics beyond visible text `Bước 1 / 3`; log as an accessibility gap |
| Split method | `Chia đều`, `Số tiền`, `Phần trăm`, and `Trọng số` are buttons with visual selected state only; no `aria-pressed` | Tests can click by role/name but cannot reliably assert selection through ARIA |
| Member selection | Member toggles are buttons with dynamic names, not checkboxes and without `aria-pressed` | Assert the dynamic accessible name and resulting controls, not checked state |
| Split validation | Changing validation text is neither `role=alert` nor in an `aria-live` region | Screen readers may not announce invalid totals |
| Receipt input | The wrapping label includes title, helper text, and native file text | Use a regex label locator; exact accessible name may vary by browser |
| Account trigger | No explicit `aria-haspopup`, `aria-expanded`, or stable label | Exclude it from core form locators unless navbar behavior is under test |
| Date default | UTC ISO date is used rather than a local calendar date | Near midnight in Asia/Bangkok, the default may differ from the user's local day |

## Network and Mutation Inventory

All Axios API requests first ask Supabase for the current session and attach
`Authorization: Bearer {access_token}` when available. The Next proxy also
checks Supabase claims before allowing the protected page.

| Trigger | Method and path | Request data | Observable result |
| --- | --- | --- | --- |
| Load page | `GET /api/v1/rooms` | None | Room combobox options |
| Resolve initial/change room | `GET /api/v1/rooms/{roomId}` | None | Active payer options |
| Save or continue | `POST /api/v1/rooms/{roomId}/expenses` | `title`, numeric `total_amount`, `paid_by_member_id`, `expense_date`, optional `note` | Draft response, success toast, query cache update, route change |
| Receipt selected after draft succeeds | `POST /api/v1/expenses/{expenseId}/receipts` | Multipart form data field `file` | Upload completes before route change |
| Step 2 load | `GET /api/v1/expenses/{expenseId}` | None | Draft and existing items |
| Step 2 room load | `GET /api/v1/rooms/{roomId}` | None | Active members and names |
| Add item in step 2 | `POST /api/v1/expenses/{expenseId}/items` | `name`, `quantity: 1`, `unit_price`, `position`, optional category | Created item |
| Save splits after item creation | `PUT /api/v1/expense-items/{itemId}/splits` | `method`, participant `member_id` and `share_value` | Item split rows |
| Delete existing item | `DELETE /api/v1/expense-items/{itemId}` | None | Item detail query invalidated |

The item and split requests are sequential. If item creation succeeds but split
creation fails, a draft item can remain on the server without splits. Tests
should represent this partial-failure state where relevant.

### Draft Request Contract

The key regression assertion for EMR-05 is:

```json
{
  "title": "Đi chợ cuối tuần",
  "total_amount": 125000,
  "paid_by_member_id": "member-from-selected-room",
  "expense_date": "2026-08-09",
  "note": "optional"
}
```

`roomId` belongs in the URL, not the JSON body. The formatted amount displayed
as `125.000` must be sent as numeric `125000`.

## Responsive Analysis

### Risks Mitigated by the New Select

| Previous risk | Current mitigation |
| --- | --- |
| Native Windows popup looked detached and visually crossed the card | Radix content is app-styled and portaled |
| Trigger or selected label widened its grid/card | Trigger and value use `min-w-0`; selected text is clamped |
| Popup exceeded the mobile viewport | Content has `max-w-[calc(100vw-2rem)]` |
| Room switch retained an invalid payer | Room change clears payer state |
| Small popup options were difficult to tap | Items have `min-h-11` |

### Residual Step 1 Risks

| Priority | Risk | Widths most affected | Required check |
| --- | --- | --- | --- |
| High | Native file input has `w-full` but no explicit `min-w-0` or `max-w-full`; browser file-selector chrome can retain a large intrinsic width | 320px, 360px | Measure input/card bounds and root scroll width |
| Medium | Four quick-zero buttons share one row; `000000` plus padding and tracking is close to one track's available width | 320px | Check text collision and bounding boxes |
| Medium | Submit actions use fixed fractional columns while shared buttons enforce `whitespace-nowrap` and `shrink-0` | 320px, 360px | Check both localized labels fit their grid tracks |
| Medium | Navbar logo and authenticated profile trigger compete for one row; a long user name is only truncated inside the trigger | 320px | Check header scroll width and trigger bounds |
| Low | Radix content uses a minimum width of 9rem; safe for planned widths but not for ultra-narrow embedded surfaces | Below 176px | Out of current viewport scope |
| Low | Opening a portaled menu near the bottom may flip its side or reduce available height | Short 320x568 viewport | Verify scrolling and option reachability |

### Residual Step 2 Risks

| Priority | Risk | Required check |
| --- | --- | --- |
| High | Exact split rows reserve 128px for the money input plus selection button and gaps, leaving very little room for long member identity at 320px | Member name must truncate while the input remains inside the row |
| Medium | Percentage/share rows reserve 96px and a suffix area | Input and suffix must remain inside the row |
| Medium | Three-column summary values have no truncation or wrapping strategy for very large VND totals | Long totals must not widen the card/root |
| Medium | Member heading and `Bỏ chọn tất cả` share a `justify-between` row without `min-w-0` handling | Long localized/member-count content must wrap without overflow |
| Low | Sticky continue card uses `bottom-20` on mobile and may cover content on short screens | Last editable row and validation message must remain scrollable above it |

## Step 2 Interactive Elements

The responsive plan explicitly includes the split editor, so these controls are
part of the analysis:

| Element | Stable locator | Notes |
| --- | --- | --- |
| Whole/itemized mode | `getByRole('button', { name: 'Chia toàn hóa đơn' })` | Visual state only; no `aria-pressed` |
| Item name | `getByRole('textbox', { name: 'Tên món' })` | Required |
| Item amount | `getByRole('textbox', { name: 'Thành tiền' })` | Formatted money control |
| Split method | `getByRole('button', { name: 'Số tiền' })` | Repeat for all four method names |
| Select all | `getByRole('button', { name: /^(Bỏ chọn tất cả|Chọn tất cả)$/ })` | Name changes with state |
| Member toggle | `getByRole('button', { name: 'Bỏ chọn {displayName}' })` | Uses display name even when UI shows nickname |
| Exact amount | `getByRole('textbox', { name: 'Số tiền của {displayName}' })` | Rendered only for selected members in exact mode |
| Percentage value | `getByRole('spinbutton', { name: 'Phần trăm của {displayName}' })` | Rendered conditionally |
| Share value | `getByRole('spinbutton', { name: 'Trọng số của {displayName}' })` | Rendered conditionally |
| Add item | `getByRole('button', { name: 'Thêm món vào đơn nháp' })` | Disabled while split validation fails |
| Delete item | Scope `getByRole('button', { name: 'Xóa' })` to the item card | Multiple items create duplicate names |
| Continue to confirm | `getByRole('button', { name: 'Kiểm tra khoản chi' })` | Disabled until totals and splits match |

## Stable Locator Guidance

Preferred order:

1. Accessible role and label/name.
2. Explicit label for date and file inputs.
3. Scope repeated item/member controls to a card or member row.
4. Use `data-slot=select-trigger` or `data-slot=select-content` only for
   geometry checks, not behavior assertions.
5. Use CSS names such as `input[name=receipt]` only when browser-specific file
   input naming prevents a label query.

Avoid:

- Generated React IDs from shared inputs.
- Radix-generated popup IDs.
- Tailwind class selectors.
- DOM position such as `nth(0)` for room/payer.
- Text-only lookup for options before opening the correct combobox.
- `selectOptions`, because both selects are Radix controls.

Example geometry targets for a real browser:

```ts
const room = page.getByRole('combobox', { name: 'Phòng' })
const payer = page.getByRole('combobox', { name: 'Người đã trả' })
const receipt = page.getByLabel(/Thêm ảnh hóa đơn/)

const rootWidth = await page.evaluate(() => ({
  client: document.documentElement.clientWidth,
  scroll: document.documentElement.scrollWidth
}))
```

## Acceptance Scenario Mapping

| Scenario | Source-backed target |
| --- | --- |
| EMR-01 | Step 1 inventory plus root/card/select/file/action bounds |
| EMR-02 | Room combobox, room detail request, payer reset and refreshed options |
| EMR-03 | Payer combobox with long option, portal containment, date reflow |
| EMR-04 | 48px select/input heights, 44px quick actions, root width at 320/360 |
| EMR-05 | Draft POST URL/body and save/continue navigation |
| EMR-06 | Conditional exact/percentage/share inputs and member-row containment |
| EMR-07 | Controlled room/payer values surviving viewport resize |
| EMR-08 | Label-based focus order and Radix keyboard behavior |

## Analyzer Conclusion

The custom Radix select directly addresses the broken native popup shown in the
reported mobile screenshot and provides stable role-based locators. The most
important remaining browser checks are file-input intrinsic width, the four
quick-zero buttons, fixed submit-button columns, and step-2 member rows at
320px.

No production code was modified during this analysis. Automated tests must not
be written until this artifact is accepted as the required page-analysis gate.
