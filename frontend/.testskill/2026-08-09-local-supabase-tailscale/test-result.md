# Local-Only Deployment Verification Result

## Result

Status: **PASS WITH CONDITIONS**

BillMates is running locally and is reachable through the private Tailscale
Serve URL:

```text
https://msi.tail41bfb8.ts.net
```

The application, Auth, Storage, REST, database migration, OCR engine,
stop/start persistence, and startup task checks pass. Two operational
conditions remain: Docker Desktop publishes Supabase ports on all host
interfaces, and the repository's pre-existing Ruff format gate reports ten
files requiring formatting. Neither condition prevents the private Tailscale
URL from working, but the host firewall should be reviewed before exposing the
machine to an untrusted LAN.

## Passed checks

- Docker Supabase services are healthy on local ports `55421` through `55424`.
- Alembic is at revision `26a0a34774e6`; the core tables exist.
- Bucket `receipts` is private, limited to 10 MiB, and accepts JPEG, PNG, and WebP.
- Tailscale Serve is HTTPS and tailnet-only; Funnel is disabled.
- Serve routes preserve Next.js pages and proxy only `/api`, `/auth/v1`, `/rest/v1`, and `/storage/v1`.
- `/`, `/auth/login`, `/auth/register`, `/api/v1/health`, `/auth/v1/health`, `/storage/v1/status`, and `/rest/v1/` return HTTP 200 through Tailscale.
- Local registration, ES256 JWT verification, public issuer `https://msi.tail41bfb8.ts.net/auth/v1`, and `aud=authenticated` pass.
- Private Storage upload/download passes; anonymous access is denied and the authorized download hash matches.
- A normal Supabase stop/start preserves the Auth user, Storage object hash, Docker volumes, and backend database health.
- PaddleOCR runs on CPU with cached PP-OCRv5 models and returns provider `paddleocr`, 491 OCR lines, and non-empty text for the local image smoke.
- Backend tests pass (`15 passed`); frontend tests pass (`3 passed`); TypeScript, ESLint, frontend build, and Ruff lint pass.
- Generated env files, local state, and logs are ignored; tracked files contain no local database/JWT/service-role values.
- Deployment scripts contain no database reset, volume deletion, `--no-backup`, or broad recursive deletion command.
- Windows startup task `BillMates Local` exists with an at-logon trigger and no secrets in its arguments.

## Conditions and follow-up

1. Docker publishes `55421` through `55424` as `0.0.0.0`/`[::]`. Tailscale
   Serve does not expose these paths publicly, but a Windows Firewall rule or
   Docker host-binding policy should block direct LAN access to those ports.
2. `ruff format --check src tests` reports ten files requiring formatting.
   `ruff check`, unit tests, and the deployment-specific changed code pass.
3. A second physical phone was not available to Codex for an automated
   tailnet/off-tailnet comparison. The URL was checked successfully from this
   host; verify once from a room member's phone.

## Evidence boundaries

- Test users and Storage objects created for Auth/Storage/persistence checks
  were deleted after verification.
- The OCR smoke used a local image to prove the real PaddleOCR engine and cache;
  verify a real receipt from a phone during the first room workflow.
- No managed Supabase account or cloud data is used by this deployment.
