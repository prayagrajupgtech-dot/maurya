# QR and ID Card Generator

React + Vite app for creating ID cards and QR verification links. The QR opens a read-only verification page with the generated person's name and phone number.

## Local Development

```bash
npm install
npm run dev
```

For testing from a phone on the same Wi-Fi:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-dev-network.ps1
```

Then open the network URL shown by Vite on your PC and generate the QR from that URL.

## Build

```bash
npm run build
```

The production files are generated in `dist/`.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

After pushing to GitHub:

1. Go to repository `Settings`.
2. Open `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to the `main` branch.

The deployed app URL will be public, so QR codes generated from that deployed URL can open on mobile without needing the same Wi-Fi.

## Netlify

You can also deploy from GitHub to Netlify. This repo includes `netlify.toml`, so Netlify should detect:

- Build command: `npm run build`
- Publish directory: `dist`

Steps:

1. Push this repo to GitHub.
2. Open Netlify and choose `Add new site > Import an existing project`.
3. Select GitHub and choose this repository.
4. Keep the detected build settings.
5. Deploy the site.

After deployment, open the Netlify URL first and generate QR codes from that deployed app URL.
