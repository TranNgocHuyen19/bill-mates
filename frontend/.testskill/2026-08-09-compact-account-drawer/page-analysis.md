# Compact Account Drawer Analysis

## Source Findings

- Drawer width changed from `min(88vw, 390px)` to `min(76vw, 320px)`.
- Drawer height changed from full dynamic viewport height to
  `min(38rem, calc(100dvh - 1.5rem))`.
- A 12px outer inset and full rounded border make the drawer read as a floating
  panel rather than a replacement screen.
- Backdrop opacity decreased from 60% to 45%, preserving more context.
- Profile avatar, typography, internal padding, icons, menu gaps, and logout control
  are more compact.
- Close, menu, and logout controls retain 44px minimum touch targets.
- Navigation links use `min-w-0`; icons do not shrink and labels remain inside the
  available panel width.
- Existing overlay close, Escape, navigation close, body scroll locking, and logout
  behavior are unchanged.

## Width Calculations

| Viewport | Panel width | Visible page after right inset |
| --- | ---: | ---: |
| 320px | 243px | 65px |
| 390px | 296px | 82px |
| 440px | 320px | 108px |

At 568px height the panel uses 544px and keeps 12px top/bottom insets. At taller
mobile heights it caps at 608px, leaving a substantial portion of the page visible
below the floating panel.

## Runtime Constraint

The drawer requires an authenticated Supabase user. The isolated browser has no test
session, so final populated screenshot comparison remains available in the user's
already signed-in browser after refresh.
