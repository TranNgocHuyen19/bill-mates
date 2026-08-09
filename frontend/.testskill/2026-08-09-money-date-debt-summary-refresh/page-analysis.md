# Money, Date, And Debt Summary Post-Change Analysis

## Runtime Boundary

- Viewport requested: 440x956.
- `/expenses/new` redirected to `/auth/login` because the isolated browser has no
  authenticated Supabase session.
- The protected UI analysis below is source-backed and extends the existing expense
  creation page analysis.

## Money Input

- Display value still uses `Intl.NumberFormat('vi-VN')`.
- Shortcut labels are `.000`, `0.000`, `00.000`, and `000.000`.
- Accessible shortcut names remain `Thêm 3 số 0` through `Thêm 6 số 0`.
- The new `Xóa một chữ số` button is 44px square inside a 48px input; it removes
  `Math.floor(value / 10)` and disables at zero.
- The input reserves 96px on the right for backspace and the VND suffix, preventing
  overlap with formatted values.
- At 320px, the four shortcut tracks are approximately 64px each after card padding
  and gaps; the longest `000.000` label remains within the track.

## Expense Date

- The default date now derives year, month, and day in local time instead of slicing
  UTC ISO output.
- The decorative calendar moved to the right side and is the only visible icon.
- The native WebKit indicator remains the full interactive picker target but is
  transparent, preserving native picker behavior without duplicate chrome.
- The input keeps a 48px height, visible focus ring, 48px right padding, tabular
  digits, and light/dark native color-scheme support.
- The shared trailing-icon wrapper is pointer-events none so it cannot block date
  interaction.

## Debt Summary

- Mobile grid has two columns.
- Current balance spans both columns with a minimum height of 112px.
- Receive and pay cards share the second row and use compact padding.
- From the 640px breakpoint, all three cards align in one row.
- Every card uses `min-w-0`; secondary values use `break-all` and tabular digits to
  contain large VND amounts.
- Meaning remains available through `Số dư của bạn`, `Cần thu`, `Cần trả`, and the
  balance status sentence rather than color alone.

## Source-Backed Responsive Estimate

At 320px viewport width:

- Main content: about 288px after page padding.
- Two-column debt cards: about 138px each after the 12px gap.
- Money shortcut buttons: about 64px each after form-card padding and three gaps.
- No new fixed width exceeds its available track.

At 440px viewport width:

- Main content: about 408px.
- Two-column debt cards: about 198px each.
- Money shortcut buttons: about 88px each.

## Deferred Visual Check

A signed-in browser session is still required to inspect the native calendar picker,
actual Supabase values, and screenshots of the populated expense and debt pages.
