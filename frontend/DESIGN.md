---
name: Harmonious Collective
colors:
  surface: '#fbf8ff'
  surface-dim: '#dbd9e2'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fc'
  surface-container: '#efedf6'
  surface-container-high: '#e9e7f0'
  surface-container-highest: '#e3e1ea'
  on-surface: '#1a1b22'
  on-surface-variant: '#454652'
  inverse-surface: '#2f3037'
  inverse-on-surface: '#f2eff9'
  outline: '#757684'
  outline-variant: '#c5c5d4'
  surface-tint: '#4355b9'
  primary: '#24389c'
  on-primary: '#ffffff'
  primary-container: '#3f51b5'
  on-primary-container: '#cacfff'
  inverse-primary: '#bac3ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#831921'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33236'
  on-tertiary-container: '#ffc4c2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#00105c'
  on-primary-fixed-variant: '#293ca0'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#881d24'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ea'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  numeric-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  display-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  margin-desktop: 48px
  gutter: 16px
---

## Brand & Style
The brand personality is dependable yet approachable, designed to reduce the friction and social awkwardness often associated with shared finances. It targets young professionals and students living in shared accommodations who value transparency and ease of use. 

The design style is **Corporate / Modern** with a focus on high-legibility and warmth. It prioritizes a "human-centric" interface that feels like a helpful assistant rather than a rigid ledger. The visual language uses soft rounded corners and a structured grid to evoke a sense of organized calm. The interface is optimized for high-frequency interactions, ensuring that adding an expense or settling a debt feels instantaneous and rewarding.

## Colors
The palette is anchored by a deep Indigo primary color to establish trust and stability. The functional colors (Emerald for credit/success, Coral for debt/danger, and Amber for pending/warning) are used intentionally to provide immediate semantic meaning to financial transactions. 

The background is a soft neutral grey to reduce eye strain, while the primary surfaces (cards and sheets) are pure white to create a clear "layering" effect. High-contrast text ensures accessibility for all users. Use the primary color for interactive elements and brand moments, while reserving the functional palette for status-driven data visualization.

## Typography
This design system utilizes **Be Vietnam Pro** for its excellent rendering of Vietnamese diacritics and its contemporary, friendly tone. The type scale is optimized for mobile readability, with generous line heights to accommodate complex characters.

Key financial figures should use the `numeric-xl` or `display` roles to ensure they are the first thing a user sees. Headlines are slightly condensed in tracking to maintain a modern aesthetic. For secondary information or metadata, use the `label-sm` role to maintain a clear hierarchy without cluttering the interface.

## Layout & Spacing
The layout follows a **fluid grid** model optimized for touch-first interaction. On mobile devices, a single-column layout is preferred, using a 16px side margin to contain elements. For tablet and desktop, the content should be centered within a max-width container (max 768px for focus-heavy tasks like expense entry) to prevent eye fatigue.

The spacing rhythm is based on a 4px baseline, ensuring all elements align predictably. Touch targets must be a minimum of 44x44px, even if the visual element is smaller. Use `lg` (24px) spacing between distinct sections and `md` (16px) for internal card padding.

## Elevation & Depth
The design system employs **Tonal Layers** combined with **Ambient Shadows** to define hierarchy. 
- **Level 0 (Background):** The base `#F9FAFB` surface.
- **Level 1 (Cards):** Pure white surfaces with a 1px `#E5E7EB` border and a very soft, diffused shadow (Offset: 0, 2px; Blur: 8px; Opacity: 4% Black).
- **Level 2 (Active/Floating):** Used for sticky bottom actions or menus. These should have a more pronounced shadow (Offset: 0, 4px; Blur: 12px; Opacity: 8% Black) to indicate they sit above the scrollable content.

Avoid heavy shadows or dark outlines. Depth is primarily signaled by the contrast between the grey background and white cards.

## Shapes
The shape language is defined as **Rounded**, utilizing a base radius of 12px to 16px for primary containers.
- **Buttons and Inputs:** Use a 12px radius (`rounded-md`) to feel modern yet structured.
- **Content Cards:** Use a 16px radius (`rounded-lg`) to soften the overall appearance of the dashboard.
- **Status Chips:** Use a full circle (`rounded-full`) to distinguish them from interactive buttons.
- **Avatars:** Always circular to provide a friendly, organic contrast to the structured grid.

## Components
### Buttons
Primary buttons use the Deep Indigo background with white text. Secondary buttons should use a light tint of the primary color or a simple 1px border. For destructive actions (e.g., "Xóa khoản chi"), use a Coral outline or text.

### Cards
The primary container for data. Instead of tables, use vertical stacks of cards. Each card should have a 16px internal padding, a 1px grey border, and a subtle shadow. When indicating a financial status (Owed vs. Owe), a 4px left-border accent in Emerald or Coral can be added to the card.

### Sticky Bottom Actions
To ensure high reachability, primary actions like "Thêm chi phí" (Add Expense) should be housed in a sticky bottom container with a subtle backdrop blur or solid white background.

### Inputs
Text fields must have clear labels and a minimum height of 48px. Use a 1px border that shifts to the primary Indigo color on focus. Support clear "trailing icons" for currency symbols (₫) or clear buttons.

### Chips & Badges
Use low-saturation backgrounds with high-saturation text for status indicators (e.g., "Đã thanh toán", "Chờ duyệt"). This ensures they are readable without competing with primary call-to-action buttons.