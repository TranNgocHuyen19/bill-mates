# Expense Reports Page Analysis

## Analysis Metadata

- Route: `/reports`
- Analysis date: 2026-08-09
- Runtime URL: `http://localhost:3000/reports`
- Runtime result: redirected to `/auth/login` because the test browser had no
  authenticated Supabase session
- Supplemental evidence: production page source, API client, query hooks, and shared
  navigation source

The authenticated page could not be inspected at runtime without creating or using a
real user account. No test account was created because that would mutate external
Supabase state. Per `stop_when_no_page_analysis = true`, this analysis documents the
auth boundary and source-derived page contract, but it does not authorize writing
frontend page tests that pretend the authenticated runtime was observed.

## Page Structure

The authenticated page renders these regions in order:

1. Shared top navigation.
2. Report hero with room/currency identity, applied date range, and Excel export.
3. Filter card with room select, inclusive start/end date inputs, apply, and reset.
4. Loading, error/retry, empty, or populated report content.
5. Mobile bottom navigation with Reports replacing History at the fourth position.

The content wrapper uses `min-w-0`, `overflow-x-clip`, responsive grids, and a
horizontally scrollable monthly chart. Cards use two columns on mobile and four on
large screens. Controls are 48 pixels high and the page reserves bottom space for the
fixed mobile navigation.

## Interactive Elements

| Element | Accessible name/source | Behavior |
| --- | --- | --- |
| Room select | `Phòng báo cáo` label and `reports-room` trigger | Changes room immediately and updates URL/query key |
| Start date | `Từ ngày` | Edits a draft inclusive date range |
| End date | `Đến ngày` | Edits a draft inclusive date range |
| Apply button | `Áp dụng` | Validates dates, updates applied filters and URL |
| Reset button | `Đặt lại tháng hiện tại` | Restores current calendar month |
| Export button | `Xuất Excel` / `Đang tạo Excel...` | Downloads one workbook using applied filters; disabled while busy or filters are unapplied |
| Report retry | `Tải lại báo cáo` | Refetches the current room/date report |
| Rooms retry | `Thử lại` | Refetches the accessible room list |
| No-room link | `Đến danh sách phòng` | Navigates to room creation/list |
| Navigation links | `Báo cáo chi tiêu`, `Báo cáo chi tiêu & xuất Excel`, `Báo cáo` | Opens `/reports`; mobile drawer closes on navigation |

## Network Contract

1. `GET /api/v1/rooms`
   - Loads accessible rooms before choosing a valid report room.
2. `GET /api/v1/rooms/{roomId}/reports`
   - Query parameters: `from_date`, `to_date`.
   - TanStack Query key includes room and both dates.
   - Request receives an abort signal to prevent stale results replacing current data.
3. `GET /api/v1/rooms/{roomId}/reports/export`
   - Uses the same applied filters.
   - Requests the XLSX MIME type and receives a blob.
   - Uses `Content-Disposition` for the safe download filename.

All requests use the shared Axios client, which attaches the Supabase access token and
handles `401` session recovery.

## Visible Data Contract

- Summary: posted expense count/total, active member count, confirmed settlement
  count/amount, and inclusive date range.
- Monthly: chronological buckets with count and total.
- Categories: label, server color, total, and client-derived percentage.
- Members: paid, owed, confirmed sent/received, and signed balance.
- Settlements: sender, recipient, date, amount, and text/icon status.
- Empty state: keeps filters and Excel export available.
- Error state: preserves the active filters and offers retry.

## ARIA And Keyboard Notes

- The page has one `h1` (`Báo cáo chi tiêu`) in the authenticated populated shell.
- Native inputs and the room select are associated with visible labels.
- Date errors use `role="alert"`, `aria-invalid`, and `aria-describedby`.
- Export exposes `aria-busy` while the mutation is pending.
- Monthly chart provides a textual `role="img"` label with all month/value pairs.
- Balance and settlement sections use `aria-labelledby`.
- Icon-only reset has an explicit accessible label.
- Status is conveyed by text and icon in addition to color.

## Responsive Risks To Verify With An Authenticated Session

- Long room and member names at 320 pixels.
- Maximum VND values in summary, member, and settlement cards.
- Native date controls on iOS/WebKit.
- Select portal geometry at 320, 360, 390, and 440 pixels.
- Monthly chart horizontal scrolling without body overflow.
- Download behavior and safe-area clearance above mobile bottom navigation.

## Runtime Auth Boundary

The real browser reached `/auth/login` and exposed the expected email, password,
password visibility, submit, Google sign-in, forgot-password, and registration
controls. This confirms middleware protection works, but an authenticated visual and
network snapshot remains pending until a user session is available.
