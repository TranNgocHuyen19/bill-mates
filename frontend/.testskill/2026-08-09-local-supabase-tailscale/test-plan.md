# Local Supabase and Tailscale Deployment Test Plan

## Planning status

- Planning artifacts only; no test or deployment command was run.
- Target host: Windows at `D:\Project\bill-mates`.
- Private application URL: `https://msi.tail41bfb8.ts.net`.
- This deployment remains local-only. Tailscale Serve is allowed; Tailscale
  Funnel must remain disabled.
- No UI or product behavior change is part of this plan.

## Objective

Prove that BillMates can run entirely on the Windows host with local Supabase
CLI services, FastAPI plus PaddleOCR, and Next.js, while room members access one
private HTTPS origin through Tailscale. The verification must also prove that
secrets do not enter Git or logs and that normal stop/start operations preserve
database and receipt data.

## Target topology

| Public or local path | Target service | Required result |
| --- | --- | --- |
| `https://msi.tail41bfb8.ts.net/` | Next.js on `127.0.0.1:3000` | BillMates pages and static assets |
| `https://msi.tail41bfb8.ts.net/api/*` | FastAPI on `127.0.0.1:8000` | Existing `/api/v1/*` routes without prefix corruption |
| `https://msi.tail41bfb8.ts.net/auth/v1/*` | Supabase API on `127.0.0.1:55421` | GoTrue Auth routes |
| `https://msi.tail41bfb8.ts.net/storage/v1/*` | Supabase API on `127.0.0.1:55421` | Storage routes |
| `https://msi.tail41bfb8.ts.net/rest/v1/*` | Supabase API on `127.0.0.1:55421` | PostgREST routes |
| `127.0.0.1:55422` | Supabase PostgreSQL | Host-only database used by Alembic and FastAPI |
| `http://127.0.0.1:55423` | Supabase Studio | Host-only administration page |

The implementation may use different script filenames from the names below.
If so, map each planned check to the documented start, stop, environment, and
startup-task scripts without weakening the assertions.

## Preconditions

- Docker Desktop, Supabase CLI, Tailscale, Node.js 20+, and Python 3.12+ are
  installed.
- The Windows host is signed into the correct tailnet and MagicDNS/HTTPS are
  enabled.
- A phone or second device in the same tailnet is available for the final
  private-network check.
- A real JPEG, PNG, or WebP receipt below 10 MB is available. It must contain
  a readable merchant, total, and at least one item.
- Test credentials and generated local keys are ephemeral. Values must never be
  copied into this plan, transcripts, screenshots, CI output, or Git.
- Capture a clean `git status --short` baseline before implementation
  verification. Existing user-owned changes are recorded and preserved.

## Scenario matrix

### LOC-01 - Start local Supabase and verify minimum services

**Method:** Infrastructure integration

1. Run the documented local start script from the repository root.
2. Query Supabase status without persisting or printing keys. Filter output to
   service names, URLs, ports, and health only.
3. Verify PostgreSQL accepts `SELECT 1` on `127.0.0.1:55422`.
4. Verify Auth responds on `/auth/v1/health`.
5. Verify Storage responds on `/storage/v1/status`.
6. Verify PostgREST responds on `/rest/v1/` when supplied the local publishable
   key in-memory.
7. Verify Studio returns HTTP 200 on `http://127.0.0.1:55423`.

**Expected outcomes:**

- Auth, PostgreSQL, Storage, PostgREST, and Studio are reachable.
- Docker reports all required Supabase containers as running or healthy.
- PostgreSQL and Studio are not exposed by Tailscale Serve.
- Failure of any required service makes the start script fail with a service
  name and remediation hint, without printing secrets.

### LOC-02 - Generate local environment files without leaking secrets

**Method:** Security and configuration integration

1. Run the documented environment-generation script.
2. Confirm backend configuration is written only to ignored local env files,
   and frontend configuration is written only to ignored local env files.
3. Use `git check-ignore` on every generated env file.
4. Compare `git status --short` with the baseline.
5. Search tracked files and captured command output for the actual generated
   database password, JWT secret, and service-role key using an in-memory
   comparison that reports only pass/fail.
6. Inspect frontend env variable names.

**Expected outcomes:**

- Generated env files are ignored and do not appear as untracked or modified.
- Script output names generated files and services but never prints secret
  values or complete connection strings.
- Frontend receives only public URLs and the Supabase publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, and database credentials
  exist only in backend-local configuration.
- No secret is passed in a Windows scheduled-task argument or Tailscale command.

### LOC-03 - Apply Alembic migrations to local Supabase PostgreSQL

**Method:** Database integration

1. Point `DATABASE_URL` at local PostgreSQL on port `55422`.
2. Run `python -m alembic upgrade head` from `backend`.
3. Run `python -m alembic current`.
4. Query for the BillMates tables and the `alembic_version` row.
5. Query `storage.buckets` for `receipts`.
6. Run `python -m alembic upgrade head` again.

**Expected outcomes:**

- Alembic reaches revision `26a0a34774e6`, the current head.
- Core tables such as `profiles`, `rooms`, `expenses`, `expense_items`,
  `expense_item_splits`, and `expense_receipts` exist.
- Bucket `receipts` is private, limited to 10 MB, and allows only JPEG, PNG,
  and WebP.
- Re-running the upgrade is idempotent and does not remove data.

### LOC-04 - Verify direct frontend and backend health

**Method:** Service smoke

1. Start FastAPI and Next.js through the documented start script.
2. Request `http://127.0.0.1:8000/api/v1/health`.
3. Request `http://127.0.0.1:3000/auth/login`.
4. Inspect start-script process ownership and duplicate-start behavior.

**Expected outcomes:**

- Backend returns HTTP 200 with `status=ok` and `database=connected`.
- Frontend returns HTTP 200 and renders the BillMates login page.
- A second start does not create duplicate listeners on ports 3000 or 8000.
- Health failure identifies the failed process without exposing its env.

### LOC-05 - Verify all same-origin Tailscale paths

**Method:** Network integration from the host and a second tailnet device

1. Inspect `tailscale serve status` and confirm Funnel is disabled.
2. Request the following through `https://msi.tail41bfb8.ts.net`:
   `/`, `/api/v1/health`, `/auth/v1/health`, `/storage/v1/status`, and
   `/rest/v1/`.
3. Load a Next.js static asset and refresh a nested application route.
4. Repeat the public-origin checks from a phone on mobile data with Tailscale
   connected.
5. Disconnect that phone from Tailscale and retry the private hostname.

**Expected outcomes:**

- Every required prefix reaches the intended service with no duplicated,
  stripped, or redirected prefix.
- The browser sees one valid HTTPS origin and no mixed-content request.
- Nested Next.js routes and static assets continue to work.
- A tailnet member can connect; a device outside the tailnet cannot.
- Studio, PostgreSQL, Uvicorn, and Next.js are not directly public.

### LOC-06 - Verify CORS and JWT issuer alignment

**Method:** Auth/API integration

1. Register or log in through the public `/auth/v1` path and capture the access
   token in memory.
2. Decode only non-secret JWT claims for assertions.
3. Call `/api/v1/auth/me` with the token.
4. Send an OPTIONS request using origin
`https://msi.tail41bfb8.ts.net`.
5. Repeat the API call with a token whose issuer or audience is intentionally
   wrong.

**Expected outcomes:**

- JWT `iss` exactly matches the configured public Supabase Auth issuer ending
  in `/auth/v1`; `aud` is `authenticated`.
- FastAPI validates the same issuer and accepts the valid token.
- The configured frontend origin is accepted without wildcard credentials.
- A wrong issuer, audience, signature, or expired token returns HTTP 401.
- No browser request fails because frontend Auth and FastAPI disagree about the
  Supabase URL.

### LOC-07 - Register, log out, and log in against local Supabase Auth

**Method:** Browser end-to-end through the Tailscale origin

1. Open `/auth/register`, enter a unique test name, email, password, and
   confirmation, then submit.
2. Verify successful navigation to the protected rooms area.
3. Call the authenticated profile endpoint so the local `profiles` row is
   created.
4. Log out and verify protected pages redirect to `/auth/login`.
5. Log in with the same credentials.
6. Refresh and reopen the browser session.

**Expected outcomes:**

- The user exists in local Supabase Auth and can obtain a local session.
- The matching BillMates profile is created in local PostgreSQL.
- Logout removes the local session; login restores access to protected pages.
- Session refresh uses the same public Auth origin and survives a page reload.
- No request is sent to a hosted `*.supabase.co` project.

### LOC-08 - Upload and download from the private `receipts` bucket

**Method:** Storage integration

1. Create a room and expense draft as the authenticated test user.
2. Upload a valid receipt through
   `POST /api/v1/expenses/{expense_id}/receipts`.
3. Verify the object exists in `receipts` and its metadata row exists in
   `expense_receipts`.
4. Attempt an anonymous public object download.
5. Download through the backend's authorized Storage path without logging the
   service-role key.
6. Compare the downloaded byte hash with the original.
7. Try an unsupported MIME type and a file over 10 MB.

**Expected outcomes:**

- Valid upload succeeds and stores the correct bucket, path, MIME type, and
  byte count.
- Anonymous download is denied and never returns the receipt bytes.
- Authorized download succeeds and has the same hash as the upload.
- Invalid type and oversize uploads are rejected without orphan metadata.

### LOC-09 - Run PaddleOCR on a real receipt

**Method:** Real local end-to-end; no OCR mock

1. Upload the real receipt from LOC-08.
2. Request `POST /api/v1/expense-receipts/{receipt_id}/ocr`.
3. Allow up to five minutes for first-run model initialization.
4. Poll the receipt until it reaches a terminal OCR state.
5. Review the scan result in the existing expense split flow.

**Expected outcomes:**

- Status progresses to `completed`, not indefinitely `pending` or `processing`.
- `ocr_data.provider` is `paddleocr`; raw lines and confidence are present.
- Merchant, total, or item suggestions are materially derived from the real
  image and can be edited before splitting.
- OCR does not automatically post the expense or create financial splits.
- A second scan uses the installed model without downloading it again.

### LOC-10 - Preserve Auth, database, and Storage data across restart

**Method:** Persistence integration

1. Record the test user's ID, expense draft ID, receipt object path, and receipt
   hash from earlier scenarios.
2. Run the documented normal stop script.
3. Confirm app processes and Supabase containers stop cleanly.
4. Run the documented start script.
5. Log in with the same local user and retrieve the same draft and receipt.
6. Download the receipt through the authorized path and compare hashes.

**Expected outcomes:**

- Local Auth user, PostgreSQL rows, Storage object, and OCR result survive.
- IDs remain unchanged and the receipt hash matches.
- Alembic remains at head after restart.
- A normal restart does not require registration, migration reset, or re-upload.

### LOC-11 - Prove stop/start scripts cannot delete persistent volumes

**Method:** Static safety gate plus runtime integration

1. Inspect the documented stop and start scripts before execution.
2. Fail the gate if they invoke destructive operations such as
   `supabase db reset`, `docker compose down -v`, `docker volume rm`, broad
   `Remove-Item -Recurse`, or `supabase stop --no-backup`.
3. Record Supabase volume names/IDs before the first stop.
4. Run two complete stop/start cycles.
5. Compare volume identities and repeat the LOC-10 data assertions.

**Expected outcomes:**

- Normal scripts contain no reset, recursive delete, or volume-delete command.
- Supabase persistent volumes remain present across both cycles.
- Repeated start/stop is idempotent and does not lose data.
- Any separate reset command, if provided, is clearly named destructive,
  interactive, and excluded from startup/shutdown automation.

### LOC-12 - Verify Windows startup task, if implemented

**Method:** Windows Task Scheduler integration

1. If an automatic startup task exists, inspect its trigger, principal, action,
   working directory, retry behavior, and command arguments.
2. Run the task manually from Task Scheduler.
3. Re-run its installer to test idempotency.
4. Reboot only during an approved deployment verification window, then repeat
   LOC-01, LOC-04, and LOC-05.
5. If no startup task is implemented, mark this scenario `N/A` and verify the
   manual startup procedure is documented.

**Expected outcomes:**

- The task starts BillMates from `D:\Project\bill-mates` after Docker and
  Tailscale are ready.
- It does not embed secrets in arguments or task XML.
- It does not open duplicate processes or visible helper windows.
- Failure is observable in a local log that redacts secrets.
- Installing twice updates/reuses one task instead of creating duplicates.

## Execution order

1. Static safety and secret checks: LOC-02 and the static portion of LOC-11.
2. Local platform: LOC-01 and LOC-03.
3. App processes and private routing: LOC-04 through LOC-06.
4. User and financial flow: LOC-07 through LOC-09.
5. Persistence and operations: LOC-10 through LOC-12.

Stop immediately if secret leakage or a destructive volume command is found.
Do not continue persistence testing until that defect is corrected.

## Evidence to retain

- Sanitized service/health matrix with status codes and timestamps.
- Sanitized Tailscale Serve route table showing Funnel disabled.
- Alembic current revision and private bucket metadata.
- Browser screenshots for registration, login, and editable OCR result.
- IDs and SHA-256 hashes only for persistence comparison.
- Start/stop cycle results and startup-task status, if applicable.

Never retain JWTs, passwords, database URLs, publishable/service-role key values,
full env files, Task Scheduler XML containing secrets, or raw receipt images
outside the approved local test artifact location.

## Definition of done

- LOC-01 through LOC-11 pass; LOC-12 passes or is explicitly `N/A`.
- All five same-origin prefixes work from a second tailnet device.
- Registration/login, private receipt upload/download, and real PaddleOCR pass.
- JWT issuer/audience and FastAPI validation agree.
- Two stop/start cycles preserve Auth, PostgreSQL, Storage, and OCR data.
- Git and captured logs contain no generated secret.
- Tailscale Funnel remains disabled and no local admin/database port is exposed.

## Out of scope

- Cloud Supabase, Cloud Run, Vercel, Netlify, or any public deployment.
- UI redesign or changes to existing mobile-first layouts.
- Load, multi-host failover, or high-availability testing.
- Destructive database reset, volume deletion, or disaster-recovery restore.
