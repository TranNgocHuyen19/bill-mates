# Local-Only Deployment Page Analysis

## Analysis status

- Source and route analysis only; no browser or test command was run.
- The deployment work changes process hosting, environment values, and reverse
  proxy routes. It must not change the existing BillMates UI.
- Runtime page analysis should be repeated after implementation using
`https://msi.tail41bfb8.ts.net`.

## Public route map

| Browser request | Upstream | Observable expectation |
| --- | --- | --- |
| `/` and application pages | Next.js `127.0.0.1:3000` | Existing responsive BillMates UI |
| `/_next/*` and static assets | Next.js `127.0.0.1:3000` | Assets load over the same HTTPS origin |
| `/api/v1/*` | FastAPI `127.0.0.1:8000` | JSON, multipart, Excel, and health responses |
| `/auth/v1/*` | Supabase API `127.0.0.1:55421` | Signup, token, refresh, logout, and JWKS |
| `/storage/v1/*` | Supabase API `127.0.0.1:55421` | Private receipt object operations |
| `/rest/v1/*` | Supabase API `127.0.0.1:55421` | PostgREST health/schema access |

Tailscale Serve must preserve these prefixes. Supabase Studio on port 55423 and
PostgreSQL on port 55422 remain host-only and have no public page route.

## Existing pages used by deployment verification

### `/auth/register`

Source-visible controls:

- Name textbox labelled `Ho va ten`.
- Email textbox labelled `Email`.
- Password textbox labelled `Mat khau`.
- Password confirmation textbox labelled `Xac nhan mat khau`.
- Password visibility button.
- Submit button labelled `Tao tai khoan`.
- Link to the login page.

Observable flow:

1. Form validation runs in the browser.
2. Signup goes to same-origin `/auth/v1/signup`.
3. With local email confirmation disabled, a session is returned.
4. The page navigates to the protected rooms area.
5. A later authenticated FastAPI profile request creates/loads the matching
   `profiles` row in local PostgreSQL.

### `/auth/login`

Source-visible controls:

- Email textbox labelled `Email`.
- Password textbox labelled `Mat khau`.
- Password visibility button with an accessible show/hide label.
- Submit button labelled `Dang nhap`.
- Forgot-password link.
- Google login button.
- Registration link.

Observable flow:

1. Password login goes to same-origin
   `/auth/v1/token?grant_type=password`.
2. The Supabase session is stored by the existing SSR/browser client.
3. Login navigates to `/rooms`.
4. FastAPI requests include the access token as `Authorization: Bearer`.
5. A 401 clears the local session and returns the user to `/auth/login`.

Google OAuth is not required for local-only acceptance because no local provider
is currently enabled in `supabase/config.toml`.

### Protected room pages

- The Next.js proxy calls Supabase Auth to refresh/check claims.
- Unauthenticated users are redirected to `/auth/login`.
- Authenticated users can reach `/rooms` and existing room management pages.
- Refreshing a nested protected URL must not become a proxy 404.

The deployment must not add a loading page, warning banner, or environment badge.

### `/expenses/new`

Existing user-facing controls relevant to Storage and OCR:

- Room, title, payer, date, amount, and note inputs.
- Receipt image chooser accepting JPEG, PNG, and WebP.
- Compact selected-image preview and upload progress.
- Draft-save and continue-to-split actions.

The receipt is uploaded only after a draft exists. The browser sends multipart
data to `/api/v1/expenses/{expense_id}/receipts`; FastAPI writes the object to
same-origin `/storage/v1` using a backend-only service-role key.

### `/expenses/new/split`

Existing OCR review behavior:

- Receipt status is loaded from
  `/api/v1/expense-receipts/{receipt_id}`.
- OCR starts through
  `/api/v1/expense-receipts/{receipt_id}/ocr`.
- Pending and processing states are visible and polled.
- Merchant, total, confidence, and item suggestions appear after completion.
- Suggestions remain editable before they enter the item split editor.
- OCR never posts the expense automatically.

No layout, label, navigation, chart, or component styling change is required by
the local deployment.

## Same-origin network sequence

```text
Phone browser
-> https://msi.tail41bfb8.ts.net/
     -> Next.js
  -> /auth/v1/*
     -> Tailscale Serve -> local Supabase Auth
  -> /api/v1/*
     -> Tailscale Serve -> FastAPI
        -> local PostgreSQL :55422
        -> /storage/v1/* with backend-only service role
        -> PaddleOCR on the Windows CPU
```

The frontend public Supabase URL, frontend API endpoint, frontend site URL,
FastAPI frontend origin, Supabase Auth external URL, and JWT issuer must all
resolve consistently to the public HTTPS hostname where required. No browser
request may use `127.0.0.1`, because that would address the phone itself.

## Network observations to capture later

| Action | Expected network effect |
| --- | --- |
| Open login | Next.js document/assets load from the Tailscale origin |
| Register | `POST /auth/v1/signup`, then navigation to `/rooms` |
| Login | `POST /auth/v1/token?grant_type=password` |
| Load protected data | `/api/v1/*` with Bearer token |
| Upload receipt | Multipart POST to `/api/v1/expenses/{id}/receipts` |
| Run OCR | POST then polling GET under `/api/v1/expense-receipts/*` |
| Refresh session | Same-origin Supabase Auth refresh request |
| Logout | Supabase Auth logout, then redirect to `/auth/login` |

No successful runtime claims are made in this artifact because tests were
explicitly not run.

## Locator and accessibility guidance

- Prefer `getByRole` with the existing Vietnamese accessible names.
- Use labels for name, email, password, confirmation, receipt input, and OCR
  edit fields.
- Use the password button's accessible show/hide name.
- Observe OCR progress through its status text and failures through alert text.
- Avoid CSS classes, generated IDs, exact Tailwind structure, and Tailscale
  implementation details as browser locators.
- Infrastructure status codes and persisted data are external outcomes and
  should be asserted outside component tests.

If runtime analysis finds a missing accessible name, report it separately. Do
not alter the UI as part of this local deployment task.

## Responsive and visual invariants

- Verify at a narrow mobile viewport and one desktop viewport.
- The private HTTPS hostname must not introduce browser mixed-content warnings.
- Existing drawers, bottom navigation, receipt preview, OCR review, and sticky
  actions must retain their current dimensions and layering.
- No horizontal overflow may be introduced by an absolute URL, error message,
  or deployment status text.
- Screenshot comparison is limited to regression detection; no redesign is
  expected.

## Deployment-specific risks

- Prefix rewriting can send `/api/v1` to `/v1` or duplicate `/api`.
- A phone cannot use frontend env values containing `localhost` or `127.0.0.1`.
- If Supabase Auth mints a local issuer while FastAPI expects the Tailscale
  issuer, every protected API call returns 401.
- Incorrect Auth redirect allow-lists can send login/reset flows to localhost.
- A service-role key in `NEXT_PUBLIC_*` becomes visible in the browser bundle.
- Exposing Supabase Studio or PostgreSQL through Serve broadens access beyond
  the application.
- Stopping Supabase with a destructive flag can remove Auth, database, and
  Storage data even when the application UI appears healthy before restart.
