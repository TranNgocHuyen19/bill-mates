# Test Plan: Visual report charts

## Scope

- Expense trend visualization
- Category distribution visualization
- Member paid-versus-owed comparison
- Mobile and empty-data behavior

## Acceptance scenarios

1. A report with expenses on multiple dates renders a readable daily trend chart with date labels, values, and an accessible text alternative.
2. A report with one active date still renders a meaningful point/bar instead of an empty-looking chart.
3. Category totals render as a donut chart whose segments and legend use the same colors and percentages.
4. Category colors fall back to design-system chart colors when the API does not provide a valid color.
5. Member rows show comparable paid and owed bars using one shared scale across members.
6. Zero-value series remain visually stable and do not divide by zero.
7. Empty report sections show concise empty states instead of blank chart frames.
8. Charts fit a 320px viewport without horizontal page overflow or unreadable labels.
9. Chart meaning is available through `role="img"` labels and visible legends, without relying on color alone.

## Verification

- Frontend typecheck, ESLint, targeted Prettier, and production build.
- Source-backed accessibility review for labels and legends.
- Responsive inspection at 320px and 390px.
- Existing backend report tests to ensure the API contract remains unchanged.
