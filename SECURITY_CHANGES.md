# Security changes in this revision

Server (`api/index.ts`)
- Removed hardcoded PayPal secret/client IDs and Cloudflare R2 access keys (env vars only; warns on startup if missing).
- Removed the default `lomon2026` admin account auto-creation and the fake `admin@system.local` admin.
- Removed trust in the `x-user-email` header (it granted admin to anyone who sent an admin email).
- Added `requireAuth` / `requireAdmin` middleware. Admin-only: fragment create/update/delete/duplicate/status, catalog sync, all R2/Cloudinary upload + CORS + record routes, `licenses/create`, email inbox/outbox/send/test/inbound.
- `/api/user/data` now requires login and returns only the caller's data (admins may pass `?email=`).
- `/api/user/clear-history` now requires login and only clears the caller's own history (wipe-all needs admin + `{ "all": true }`).
- PayPal webhook events are verified against PayPal's Orders API before being acted on.
- Passwords: salted scrypt; legacy SHA-256 hashes still verify and upgrade on next login.
- Rate limiting on login, sign-up, contact form and proposal form.
- CORS: same-origin, `APP_URL`, `ALLOWED_ORIGINS`, localhost only.
- HTML-escaped user input in all outgoing email templates.
- `/api/audio-proxy` only fetches from R2 / Cloudinary hosts (SSRF guard), redirects disabled.
- Resend inbound webhook now fails closed when a signing secret is configured.
- Escaped emails used inside MongoDB regex lookups (fixes lookups for addresses containing `+` or `.`).

Front end
- New `src/lib/apiAuth.ts` helper; admin/upload/fragment/email calls now send the session token.
- `TransmissionsOverlay` read a localStorage key (`token`) that was never written; it now uses the real token.
- Removed the `x-user-email` header from the admin dashboard and the fake admin email from `authUtils.ts`.

New files: `.env.example`, `src/lib/apiAuth.ts`, this file.

## Second revision: structure + hardening

- `api/index.ts` (5,900 lines) split into `backend/` modules (db, security, middleware, services, routes). Code was moved statement-for-statement; route registration order is preserved.
- Relative imports use `.js` extensions (required by Node ESM, since `package.json` has `"type": "module"`).
- Removed circular dependency by keeping `services/storage.ts` free of database code.
- Sessions now expire after `SESSION_MAX_AGE_DAYS` (default 30).
- `/api/system/status` no longer returns bucket / region / R2 endpoint; `/api/db-status` only shows error details to admins.
- Removed unused duplicate files `api/emailService.ts` and `api/storageService.ts`.
- Added `npm test` with unit tests for the security helpers (`backend/__tests__/security.test.ts`).
