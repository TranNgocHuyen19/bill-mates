# Test Result: Expense deletion and itemized splitting

## Result

Partial pass. All executable code checks and backend business tests pass. Authenticated visual inspection requires the user's existing Supabase session.

## Verified

- Dashboard query now requests only `posted` expenses.
- The cancelled `hehe` row remains in Supabase/Postgres with `cancelled_at` for audit history and has zero items.
- The room total and debt services already restrict calculations to posted expenses.
- Debt calculation reads `ExpenseItemSplit.amount_owed`, not an equal division of the expense total.
- The split page defaults to itemized mode.
- A new item starts with a blank name and blank/zero amount.
- Whole-bill splitting remains an explicit option and prefills the remaining amount.
- Mode controls expose `aria-pressed` and retain 44px minimum touch targets.

## Automated checks

- Frontend TypeScript: passed.
- Frontend ESLint: passed.
- Targeted Prettier check: passed.
- Frontend production build: passed; a fresh `.next/BUILD_ID` was created.
- Backend expense and debt tests: 6 passed.
- Git whitespace check: passed.

## Limitations

- `frontend/testskill.config.toml` specifies `npm run test`, but `frontend/package.json` has no `test` script or frontend test runner dependencies.
- The isolated browser session redirected protected pages to Supabase login, so authenticated mobile visual inspection was not performed.
- The automated verifier agent was unavailable because its provider had no active credentials; this report is the documented fallback verification.

## Residual risk

- The final visual behavior should be refreshed once in the user's signed-in browser at a 320-390px viewport.
