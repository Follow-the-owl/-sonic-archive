# The Owl Clock

A sonic archive and music-licensing storefront. Visitors explore a small catalogue of dark-ambient audio "fragments" (each tied to a time of night, such as `11:11 PM`), preview them, and buy a license to use them. Buyers get a client dashboard with their licenses and downloads. The owner gets an admin dashboard to upload fragments, manage licenses, payments and users, and handle clearance requests and email.

The app is a single full-stack TypeScript project: a React front end and an Express API, served together.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Getting started](#getting-started)
5. [Environment variables](#environment-variables)
6. [Scripts](#scripts)
7. [How it works](#how-it-works)
8. [API overview](#api-overview)
9. [Data model](#data-model)
10. [Deployment](#deployment)
11. [Before going to production](#before-going-to-production)

---

## Features

- **Fragment catalogue**: five canonical fragments (`10:00`, `11:11`, `01:16`, `03:21`, `09:41`) with key, BPM, duration, artwork and recovery metadata. Seed data lives in `data/fragments.json`.
- **In-browser audio engine**: Tone.js playback, synthesized fallback voices (drone, keys, bell, noise, pulse) and a visualiser (`src/audio.ts`).
- **License tiers**: Archive Access ($150), Commercial Release ($500), Commercial Exploitation ($1,000), Exclusive Archive Acquisition ($5,000), plus custom-quote Sync/Master and Producer Collaboration tiers (`src/licenses.ts`).
- **Checkout**: PayPal order creation and capture, with server-side price verification.
- **Generated legal documents**: license agreements as PDF/DOCX (`src/lib/licenseAgreements.ts`, `src/lib/archivalDocumentGenerator.ts`), and a public license-verification page.
- **Accounts**: sign-up/login, client dashboard (licenses, payments, requests, documents), license transfer.
- **Admin dashboard**: fragment wizard (uploads, stems, pricing, time capsule), licenses, payments, users, clearance requests, email inbox/outbox.
- **Email**: transactional and contact emails via Resend, with SMTP fallback and a sandbox outbox when neither is configured.
- **Storage**: Cloudflare R2 (presigned uploads, audio proxy/streaming) and Cloudinary for images.
- **Legal and policy pages**: Terms, Privacy, Cookies, Refunds, Acceptable Use, Licensing Schedule, Clearance Guide.

## Tech stack

| Layer | Tools |
|---|---|
| Front end | React 19, Vite 6, Tailwind CSS 4, Motion, lucide-react |
| Audio | Tone.js |
| Documents | jsPDF, docx, JSZip |
| Back end | Express 5, Node, `tsx` for dev |
| Database | MongoDB (falls back to in-memory mock storage) |
| Payments | PayPal REST API |
| Email | Resend, Nodemailer (SMTP) |
| File storage | Cloudflare R2 (S3 API), Cloudinary |
| Hosting | Vercel (`vercel.json`) or any Node host |

## Project structure

```
.
├── api/
│   └── index.ts            # Entry point (~100 lines): creates the Express app, mounts middleware + routes in order, exports the Vercel handler
├── backend/
│   ├── db.ts               # MongoDB connection + in-memory fallback, seed/persisted fragments, shared DB state
│   ├── security.ts         # Password hashing, sessions, requireAuth/requireAdmin, rate limiting, HTML escaping
│   ├── middleware.ts       # CORS, API URL normalisation, body parsing, lazy DB initialisation
│   ├── types.ts            # Shared types (User, License, Payment, Fragment…)
│   ├── services/
│   │   ├── email.ts        # Resend/SMTP sending and email templates
│   │   ├── storage.ts      # Cloudflare R2 + Cloudinary helpers
│   │   ├── paypal.ts       # PayPal config, hosted plans, access token, server-side price verification
│   │   └── purchases.ts    # License numbers, building license records, exclusive-beat handling
│   ├── routes/
│   │   ├── emails.ts       # Contact/proposal forms, Resend webhook, admin inbox/outbox
│   │   ├── accounts.ts     # Status, sign-up/login/session, user data, licenses
│   │   ├── payments.ts     # PayPal orders/capture/webhook, purchases, license verification, downloads
│   │   ├── admin.ts        # Admin management of users, payments, licenses, clearance requests
│   │   ├── fragments.ts    # Fragment CRUD, duplicate, status, catalog sync
│   │   └── storage.ts      # File streaming, R2 presign/upload, audio proxy, Cloudinary
│   └── __tests__/          # Unit tests (npm test)
├── data/
│   └── fragments.json      # Seed catalogue of the five fragments
├── src/
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Top-level state, navigation and auth handling
│   ├── audio.ts            # Tone.js audio engine
│   ├── data.ts             # Front-end fragment definitions and helpers
│   ├── licenses.ts         # License tier definitions and pricing
│   ├── components/         # Pages, sections, dashboards, overlays, checkout
│   │   ├── AdminDashboard.tsx
│   │   ├── ClientDashboard.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── FragmentDetailPage.tsx
│   │   ├── NewFragmentWizardModal.tsx
│   │   ├── OwlClock.tsx            # The main clock interface
│   │   └── …                       # Legal pages, contact, vault, archive sections
│   └── lib/
│       ├── fragmentService.ts          # Front-end fragment CRUD and local caching
│       ├── licenseAgreements.ts        # License agreement text and templates
│       ├── archivalDocumentGenerator.ts
│       ├── authUtils.ts                # Admin/client role helpers
│       └── genreMoodTaxonomy.ts
├── server.ts               # Entry point: imports ./api/index
├── vite.config.ts
├── vercel.json             # Routes /api/* to the Express handler, everything else to index.html
└── package.json
```

**Why the order of registration matters.** Express runs middleware and routes in the order they are registered, so `api/index.ts` mounts them in a fixed sequence: core middleware (CORS, URL normalisation, body parsing) → file streaming → lazy DB init → emails → accounts → payments → admin → fragments → storage. Reordering can change behaviour (for example, the admin guard must run before the admin routes).

**Notes on the module layout**

- Imports between backend files end in `.js` (for example `../db.js`). That is required by Node's ES-module loader (`"type": "module"`) and still resolves to the `.ts` files in dev, tests and the build.
- `db.ts` owns the shared mutable state (`db`, `useMockDb`, the in-memory stores). Other modules import it as live bindings and never reassign it; the one writer outside `db.ts` is `enableMockDb()`.
- `services/storage.ts` and `services/paypal.ts` are leaf modules with no database dependency, so there are no circular imports.

## Getting started

**Prerequisites:** Node.js 20+ (the repo also contains a `bun.lock`, so Bun works too).

```bash
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run dev
```

The app starts on `http://localhost:3000`. In development, Vite runs as middleware inside Express, so the front end and API share one port.

**Local development works with little configuration.** Without `MONGODB_URI`, data lives in memory and resets on restart. Without email keys, emails go to a sandbox outbox. PayPal checkout and R2 uploads need **your own** keys: there are no built-in default credentials.

## Environment variables

Set these in `.env.local` (never commit them; `.env*` is git-ignored).

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default `3000`) |
| `NODE_ENV` | `production` serves the built `dist/` folder |
| `APP_URL` | Public base URL, used in emails and PayPal return links |
| `MONGODB_URI` | MongoDB connection string. If missing or failing, the app uses in-memory storage |
| `PAYPAL_MODE` | `sandbox` (default) or `live` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | PayPal REST credentials |
| `PAYPAL_HOSTED_PAYMENT_URL` | Hosted checkout fallback link |
| `RESEND_API_KEY` | Enables email through Resend |
| `RESEND_FROM_EMAIL`, `RESEND_DOMAIN_VERIFIED` | Sender address, and whether your domain is verified with Resend |
| `RESEND_WEBHOOK_SECRET` | Verifies inbound-email webhooks |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | SMTP fallback (defaults to Gmail on port 465) |
| `ADMIN_EMAILS` | Comma-separated emails that get the admin role (in addition to `ADMIN_NOTIFICATION_EMAIL`) |
| `ADMIN_NOTIFICATION_EMAIL` | Receives contact and clearance notifications, and is treated as an admin |
| `SESSION_MAX_AGE_DAYS` | How long a login stays valid (default `30`) |
| `ALLOWED_ORIGINS` | Optional extra browser origins allowed to call the API (comma separated). Same-origin, `APP_URL` and localhost are always allowed |
| `COLLABORATION_EMAIL` | Reply-to for collaboration enquiries |
| `CLOUDFLARE_ACCOUNT_ID` | Used to build the R2 endpoint |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 credentials (aliases: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) |
| `CLOUDFLARE_R2_BUCKET_NAME` | Bucket name (default `owl`) |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public base URL for stored files |
| `R2_REGION`, `R2_ENDPOINT` | Optional R2 overrides |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads |
| `VITE_ADMIN_EMAIL` | Optional extra admin email on the front end |

> The README template from AI Studio mentioned `GEMINI_API_KEY`. Nothing in the code uses Gemini, so you can ignore it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts Express with Vite middleware (`tsx server.ts`) |
| `npm run build` | Builds the front end to `dist/` and bundles the server to `dist/server.cjs` |
| `npm start` | Runs the production server (`node dist/server.cjs`) |
| `npm run lint` | Type-checks with `tsc --noEmit` |
| `npm test` | Runs the unit tests in `backend/__tests__` (Node's built-in test runner via `tsx`) |
| `npm run clean` | Removes build output |

## How it works

### Request flow

```
Browser (React)  ──►  /api/*  ──►  Express (api/index.ts)  ──►  MongoDB / in-memory
                                          │
                                          ├──►  PayPal REST API   (orders, capture, webhook)
                                          ├──►  Cloudflare R2     (presigned uploads, audio proxy)
                                          ├──►  Cloudinary        (images)
                                          └──►  Resend / SMTP     (email)
```

### Purchase flow

1. The visitor adds fragments and a license tier to the cart (`lomon_cart` in `localStorage`).
2. `POST /api/paypal/create-order` recalculates prices on the server (`verifyCartPricing`) and creates a PayPal order. Client-supplied prices are not trusted.
3. After approval, `POST /api/paypal/capture-order` captures the payment and records it as `COMPLETED`.
4. `POST /api/user/purchase` issues licenses only if a completed payment matching the reference exists.
5. A license number (e.g. `TOC-CR-2026-12345`) is generated, a confirmation email is sent, and the license appears in the client dashboard. Anyone can check it at `/api/v1/licenses/verify/:license_number`.

### Authentication

- Passwords are stored as salted scrypt hashes (`scrypt$salt$hash`) in the `users` collection. Older unsalted SHA-256 hashes still work and are upgraded automatically on the next login.
- Login returns a random 64-character token, stored in `sessions` and sent as `Authorization: Bearer <token>`. The server identifies callers **only** by this token. Client-supplied identity headers are ignored.
- Roles are `admin` or `client`. Admin status comes from an email allow-list (`ADMIN_EMAILS` / `ADMIN_NOTIFICATION_EMAIL` env vars plus the owner address in `api/index.ts`, mirrored in `src/lib/authUtils.ts` for UI gating only).
- Two small middlewares guard routes: `requireAuth` (any signed-in user) and `requireAdmin` (admins only). All `/api/admin/*` routes, fragment writes, uploads, license creation and the email inbox/outbox/send/test routes require admin.
- Login and sign-up are rate limited, as are the public contact and proposal forms.

### Storage

- **Audio and stems** upload to R2, either directly from the browser through a presigned URL (`GET /api/upload-url`) or through the server (`POST /api/upload/r2`). `/api/audio-proxy` streams audio with byte-range support.
- **Images** go to Cloudinary through signed uploads.
- **Fragment metadata** lives in MongoDB, seeded from `data/fragments.json`.

### Mock mode

If MongoDB is unreachable, the server sets `useMockDb = true` and serves everything from in-memory arrays and maps. This is convenient for local work. In production it means data silently disappears on restart, so check `GET /api/db-status` after deploying.

## API overview

| Group | Routes |
|---|---|
| Status | `GET /api/db-status`, `GET /api/system/status` |
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| User | `GET /api/user/data`, `POST /api/user/purchase`, `POST /api/user/request`, `POST /api/user/clear-history` |
| Licenses | `POST /api/licenses/create`, `POST /api/licenses/transfer`, `GET /api/v1/licenses/verify/:license_number` |
| PayPal | `GET /api/paypal/plans`, `POST /api/paypal/create-order`, `POST /api/paypal/capture-order`, `GET /api/paypal/order-status/:orderId`, `POST /api/paypal/webhook`, `GET /api/paypal/return` |
| Fragments | `GET/POST /api/fragments`, `GET/PUT/DELETE /api/fragments/:id`, `PATCH /api/fragments/:id/status`, `POST /api/fragments/:id/duplicate` |
| Storage | `GET /api/upload-url`, `POST /api/upload/r2`, `POST /api/storage/r2/save-record`, `GET /api/storage/r2/files`, `GET /api/audio-proxy`, `POST /api/storage/cloudinary/sign`, `POST /api/upload/cloudinary` |
| Email | `POST /api/emails/send-transmission`, `POST /api/emails/send-proposal`, `POST /api/emails/send`, `GET /api/emails/inbox`, `GET /api/emails/outbox`, `POST /api/emails/test`, `POST /api/webhooks/resend-inbound` |
| Admin | `/api/admin/payments`, `/api/admin/licenses`, `/api/admin/users`, `/api/admin/clearance` (CRUD) |

## Data model

MongoDB collections: `users`, `sessions`, `licenses`, `payments`, `requests`, `email_logs`, `emails`, `fragments`.

A **fragment** has an `id` (the time, e.g. `11:11`), name, classification, key, BPM, duration, synth type, audio URLs (`mp3Preview`, `wavMaster`, `stemsZip`), status, availability (`available`, `sold`, `reserved`), exclusivity flags and an optional time capsule.

A **license** has a license number, the fragment, tier, licensee email and legal name, date, ISRC/ISWC placeholders, a contract hash and a status.

## Deployment

**Vercel:** `vercel.json` rewrites `/api/*` to the Express handler and everything else to `index.html`. `api/index.ts` exports a default handler and skips `app.listen` when `VERCEL` is set. Keep helper code in `backend/` (not `api/`), because every file inside `api/` can be deployed as its own serverless function. Add all environment variables in the Vercel dashboard.

**Any Node host:**

```bash
npm run build
NODE_ENV=production npm start
```

Serverless note: Vercel instances don't share memory, so in-memory sessions, emails and uploads do not persist between requests. Production **requires** a working `MONGODB_URI`.

## Before going to production

This app takes payments and issues legal licenses, so work through this list.

Done in code:

- [x] No hardcoded credentials or default accounts or passwords in `api/index.ts`.
- [x] Session token is the only source of identity; admin and auth middleware on sensitive routes.
- [x] PayPal webhook events are confirmed with PayPal before they are trusted.
- [x] Salted scrypt password hashing (legacy hashes upgrade on login), plus login and form rate limiting.
- [x] CORS restricted to same-origin, `APP_URL`, `ALLOWED_ORIGINS` and localhost.
- [x] User input is HTML-escaped in outgoing emails.
- [x] The audio proxy only fetches from your own storage hosts.
- [x] Login sessions expire (30 days by default), and public status endpoints no longer reveal bucket or endpoint details.
- [x] `api/index.ts` split into focused modules under `backend/`, plus unit tests for the security helpers (`npm test`).

Still on you:

- [ ] **Rotate** the PayPal secret and the R2 access keys that were previously in the code. They remain in your git history, so treat them as compromised.
- [ ] Set every required environment variable in your host **before** deploying (see `.env.example`).
- [ ] Use a real `MONGODB_URI` in production (sessions and data are lost without it, especially on serverless hosts).
- [ ] Master WAV and stem files are in a **public** R2 bucket and their URLs are returned by `GET /api/fragments`, so anyone who has a URL can download them without buying. Move masters to a private bucket and serve them only through `/api/storage/r2/presign-download`.
- [ ] Add email verification at sign-up, so nobody can register an owner email before the owner does.
- [ ] Add automated tests for pricing, license issuance and route access control (only the security helpers are covered today).
