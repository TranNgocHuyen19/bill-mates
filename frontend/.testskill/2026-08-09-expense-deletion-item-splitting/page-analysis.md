# Page Analysis: Expense deletion and itemized splitting

## Room dashboard

### User-visible elements

- "Khoản chi gần đây" section with expense title, status, and total.
- "Thêm khoản chi" primary action.
- Link to the dedicated draft and expense list.
- Posted expense total in the room summary.

### Data and states

- `useExpensesQuery(roomId, status)` calls `GET /api/v1/rooms/{roomId}/expenses`.
- An omitted status currently returns draft, posted, and cancelled rows.
- The room total is already calculated from posted expenses only.
- Empty, loading, and populated states are present.

### Accessibility and mobile risks

- Main actions meet the 44px touch-target requirement.
- Long expense titles truncate without widening the card.
- Filtering must happen at the query boundary so cancelled rows do not flash or occupy recent slots.

## Expense split page

### User-visible elements

- Whole-bill and itemized mode selector.
- Reconciliation summary: entered amount, remaining/over amount, and item count.
- Saved item cards with participants and allocated amounts.
- Item editor with item name, amount, split method, and member selection.
- Continue button disabled until all item and split totals reconcile.

### Data and states

- `GET /api/v1/expenses/{expenseId}` returns `items[]`, each with `splits[]`.
- `POST /api/v1/expenses/{expenseId}/items` creates an item.
- `PUT /api/v1/expense-items/{itemId}/splits` saves that item's independent split.
- `DELETE /api/v1/expense-items/{itemId}` removes a draft item.
- Saving or deleting invalidates the expense detail query.

### Accessibility and mobile risks

- Mode buttons and member selection must expose a visible selected state.
- Itemized mode needs a concise explanation because its data model is not obvious from the form alone.
- Item amount must start empty/zero in itemized mode; prefilling the full remaining bill visually implies whole-bill splitting.
- Controls must remain at least 44px tall and avoid horizontal overflow at 320px.
- Re-keying the editor after a saved item must reset name, amount, and split inputs for the next item.

## Expected post-change behavior

- Dashboard requests posted expenses only.
- Cancelled expenses remain auditable but are absent from recent operational cards.
- Itemized mode is selected initially.
- Itemized mode starts with a blank name and zero amount.
- Whole-bill mode explicitly prefills the remaining amount and aggregate item name.
