# Expense Drafts and Money Entry Test Plan

## Scope

Cover the mobile-first expense workflow requested for Bill Mates:

- VND inputs format digit groups while typing and expose flexible zero-appending controls.
- A user can explicitly save an expense as a server-backed draft.
- Drafts have a dedicated, room-scoped list and can be resumed.
- Expense items show the members selected for each item and the amount owed by each member.

The FastAPI API and Supabase PostgreSQL database remain the persistence boundary.
Browser-only storage is not accepted as draft persistence.

## Definitions of Done

### Money input component

- Typing `100000` displays `100.000` and submits numeric value `100000`.
- Pasted punctuation or currency text is normalized to digits without producing `NaN`.
- Entering `25` and choosing `000` renders `25.000` while keeping the submitted value numeric.
- Zero-appending controls support `000`, `0000`, `00000`, and `000000` instead of fixed denominations.
- The field does not render instructional helper copy or fixed `+10K`/`+50K` suggestions.
- Empty and zero values cannot submit a required positive-money field.
- The field keeps an accessible label, numeric mobile keyboard hint, VND suffix, and 44px touch targets.
- The compact exact-split variant formats VND without rendering quick-add controls.

### Create expense page

- The primary continue action creates a draft and navigates to the item split step.
- The secondary save-draft action sends the same valid draft request and navigates to the dedicated draft list.
- The outgoing payload contains an integer `total_amount`, never a formatted string.
- Pending and API error states remain visible and prevent duplicate submission.

### Draft and expense list page

- The room selector scopes `GET /api/v1/rooms/{room_id}/expenses`.
- Draft and posted expenses render in separate sections; cancelled expenses are not mixed into either section.
- A draft displays item progress and resumes at split or confirmation based on server data.
- Cancelling a draft calls `POST /api/v1/expenses/{expense_id}/cancel`, removes it after query invalidation, and does not affect posted totals.
- Refresh reconstructs the list from API data.
- A posted expense exposes its item count and an expandable per-member owed summary.
- Loading, no-room, empty-draft, empty-posted, and request-error states are understandable.

### Item split page

- Item amount uses the formatted VND input and submits the raw integer value.
- Exact split amounts use formatted VND inputs.
- Equal, exact, percentage, and shares show a per-member preview.
- Invalid exact totals, percentage totals, or non-positive shares block saving with an actionable message.
- Saved item cards list each selected member and the backend-returned `amount_owed`.

## Planned Automated Tests

### Reusable component test

File: `features/expenses/components/money-input.test.tsx`

1. When typing a VND amount, then formatted display and submitted raw value agree.
2. When appending zeros, then the visible and submitted values update together.
3. When zero controls are disabled, then no quick-entry controls are rendered.

### Page-level behavior

The draft list and split page are verified through browser smoke testing against the
running API because the repository does not yet contain the configured MSW page-test
harness. A future page test should mock only HTTP/Auth boundaries and assert:

1. Saving a draft sends the raw VND amount and routes to `/expenses?roomId=...`.
2. Resuming a draft requests the correct `expenseId`.
3. Cancelling a draft sends the cancellation mutation and removes the card.
4. Saved item splits render member names and backend-returned amounts.

## Browser Matrix

- `390x844`: money keyboard/input behavior, quick-add wrapping, draft cards, split member rows, sticky actions.
- `768x1024`: two-column card reflow and member amount controls.
- `1440x900`: centered content width, room selector, expandable posted-expense summaries.

## Verification Gate

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run prettier`
- `npm run build`
- Browser smoke check at `390x844`
- Backend health check and a read-only database query confirming draft rows remain in `expenses` with `status = 'draft'`
- Final test result recorded in `test-result.md`
