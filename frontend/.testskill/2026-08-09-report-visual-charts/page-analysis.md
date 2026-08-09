# Page Analysis: Reports

## Existing report data

- `monthly[]`: month, expense count, total.
- `categories[]`: category name, optional color, total.
- `members[]`: paid, owed, settlements, and balance.
- `expenses[]`: individual posted expenses with date and total.

## Existing UI issue

- The default date range is the current month, so `monthly[]` usually produces a single bar.
- Category distribution is represented only by progress bars.
- Member contribution is represented only by text cards.
- The screen technically contains chart-like elements but does not communicate patterns at a glance.

## Planned visible elements

- Daily expense trend derived from `expenses[]`.
- Donut chart derived from `categories[]`, paired with a compact legend.
- Paid-versus-owed comparison bars derived from `members[]`.
- Existing summary, balances, settlements, filters, and Excel export remain unchanged.

## Accessibility and responsive constraints

- Every chart needs an accessible text summary.
- Legends include labels, amounts, and percentages so color is supplementary.
- SVG labels remain readable at 320px; no fixed minimum width or horizontal page scroll.
- Dynamic colors are constrained to safe API colors or design-system fallbacks.
- Touch interactions are not required to understand the chart.
