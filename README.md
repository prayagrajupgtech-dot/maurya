# QR and ID Card Generator

React + Vite app for creating ID cards and database-backed QR verification links. Netlify Functions keep the Supabase secret key out of the browser bundle.

## Local Development

```bash
npm install
npm run dev
```

The Vite server only runs the frontend. Use Netlify Dev when testing card creation and verification Functions locally.

## Build

```bash
npm run build
```

The production files are generated in `dist/`.

## Netlify

This repo includes `netlify.toml`, so Netlify detects:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Set these environment variables in Netlify before deploying:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_PLAN_ID
RAZORPAY_WEBHOOK_SECRET
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

`SUPABASE_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` must only be available to server-side Functions and must never use a `VITE_` prefix.

The public root route shows the membership plan. Administrators can open `#/admin` and sign in with
`ADMIN_PASSWORD`; `ADMIN_SESSION_SECRET` signs the 12-hour HttpOnly admin session cookie. Keep both values
server-only and use long, unique production secrets.

## Supabase

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor. The app uses:

- `create-card` to create an active database record.
- `verify-card` to read the latest public verification status.
- `update-card` to persist edited scan-page name and phone details.

New QR codes contain only a random database UUID. QR codes created by older app versions remain readable as legacy, non-database-verified records.

## Security

The database secret is protected by Netlify Functions and the table denies direct anonymous access. The generator UI and card-creation endpoint require an authenticated admin session.

## Razorpay Test Mode

The `#/plans` route creates a Razorpay subscription with a 30-day delayed start and 60 monthly billing cycles. Configure a Razorpay webhook at:

```text
https://YOUR_SITE/.netlify/functions/razorpay-webhook
```

Use the same webhook secret stored in `RAZORPAY_WEBHOOK_SECRET`. Subscribe to subscription lifecycle events, including authenticated, activated, charged, pending, halted, completed, and cancelled. Run the subscription tables in [supabase/schema.sql](supabase/schema.sql) before testing.

Do not enable live credentials until authentication, customer cancellation, support, privacy, refund, and production monitoring workflows are complete.
