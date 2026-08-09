# Compact Account Drawer Test Plan

## Acceptance Criteria

- At 320-440px widths the drawer occupies no more than 76% of the viewport and
  leaves a clearly visible strip of the underlying page.
- The panel is inset from screen edges, reads as a floating right-side sheet, and
  never exceeds 320px.
- Profile, navigation, close, and logout controls remain readable and at least 44px
  high.
- Long Vietnamese labels and email text wrap or truncate inside the panel without
  horizontal overflow.
- The drawer remains vertically scrollable on short screens and respects safe-area
  padding.
- Overlay click, close button, navigation links, and logout behavior remain
  unchanged.

## Verification

- Run TypeScript, ESLint, changed-file formatting, production build, and whitespace
  checks.
- Perform source-backed width calculations at 320, 390, and 440px.
- Record a final result; authenticated screenshot verification is deferred if the
  isolated browser redirects to login.
