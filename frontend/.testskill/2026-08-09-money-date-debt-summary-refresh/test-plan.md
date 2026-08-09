# Money, Date, And Debt Summary UI Refresh Test Plan

## Scope

- `/expenses/new`: total-money entry and expense-date control.
- `/debts`: current balance, amount to receive, and amount to pay summary.
- Primary viewport: 440x956, with regression checks at 320x568 and 390x844.

## Acceptance Scenarios

| ID | Scenario | Acceptance |
| --- | --- | --- |
| MDR-01 | Quick zero labels | Four shortcuts preserve 3-6 appended zeros and visually group digits with Vietnamese `.` separators. |
| MDR-02 | Quick zero behavior | Starting from a non-zero amount, each shortcut appends exactly its advertised zero count and keeps the formatted input value numeric. |
| MDR-03 | Delete one digit | A 44px icon button removes exactly the last digit per tap, reaches zero safely, and is disabled at zero. |
| MDR-04 | Keyboard behavior | Typing, paste sanitization, hidden form value, max clamping, and VND formatting remain unchanged. |
| MDR-05 | Local default date | The default expense date uses the user's local calendar date rather than UTC slicing. |
| MDR-06 | Date appearance | The control has one intentional calendar icon, aligned text, a visible focus state, and no duplicate browser icon. |
| MDR-07 | Date operation | Clicking/tapping the control still opens the native date picker and submits the ISO date. |
| MDR-08 | Compact debt summary | On mobile, current balance spans the row and receive/pay cards share the next row, reducing vertical height substantially. |
| MDR-09 | Large values | Long VND values wrap or shrink without widening the page or overlapping icons. |
| MDR-10 | Responsive reflow | At tablet/desktop widths all three summary cards align in one row with consistent height and hierarchy. |
| MDR-11 | Accessibility | Money delete has an action label, disabled state is exposed, debt cards include text meaning beyond color, and touch targets remain at least 44px. |

## Verification

- Run TypeScript, ESLint, changed-file Prettier, and Next.js production build.
- Inspect source-backed responsive constraints and the protected-route auth boundary.
- Reuse the existing expense page analysis for form semantics; add a focused
  post-change analysis and final `test-result.md`.

## Constraints

- The frontend has no configured `npm run test` script or canonical test example.
- Protected pages redirect an isolated browser to Supabase login without a supplied
  authenticated test session, so populated visual inspection may remain deferred.
