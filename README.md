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
```

`SUPABASE_SECRET_KEY` must only be available to server-side Functions and must never use a `VITE_` prefix.

## Supabase

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor. The app uses:

- `create-card` to create an active database record.
- `verify-card` to read the latest public verification status.
- `update-card` to persist edited scan-page name and phone details.

New QR codes contain only a random database UUID. QR codes created by older app versions remain readable as legacy, non-database-verified records.

## Security

The database secret is protected by Netlify Functions and the table denies direct anonymous access. The generator UI itself is currently public; add issuer authentication before allowing untrusted users to access a commercial card-issuance workflow.
