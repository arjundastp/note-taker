# Notes App

Apple Notes-style note taking: rich-text notes and ink sketch notes, pin, share
(copy / Markdown / PDF / image), email+password login that stays signed in.

- `api/` — Node + Express + Prisma + Postgres (Neon), deployed on Vercel.
- `mobile/` — Expo (React Native) app, built to an Android APK.

Design: [docs/2026-10-30-notes-app-design.md](docs/2026-10-30-notes-app-design.md).
Plan: [docs/superpowers/plans/2026-10-30-notes-app.md](docs/superpowers/plans/2026-10-30-notes-app.md).

## API — local

```bash
cd api
cp .env.example .env            # paste DATABASE_URL + DIRECT_URL, set JWT_SECRET
npm install
npx prisma migrate deploy       # or `migrate dev` while developing
npm run dev                     # http://localhost:3000  → GET /healthz
npm test                        # 17 tests (needs a Postgres; see .env.test)
```

## API — deploy on Vercel

The API runs as a single serverless function: `api/api/index.ts` exports the
Express app and [`api/vercel.json`](api/vercel.json) rewrites every path to it.

1. **Neon** ([neon.tech](https://neon.tech)): create a project, copy the
   **pooled** connection string (`DATABASE_URL`) and the **direct** one
   (`DIRECT_URL`).
2. **Migrate** once from your machine:
   ```bash
   cd api && DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
   ```
3. **Vercel** ([vercel.com/new](https://vercel.com/new)): import this repo and
   set **Root Directory = `api`**. Add env vars `DATABASE_URL` (pooled),
   `DIRECT_URL` (direct), and `JWT_SECRET` (16+ chars). Deploy.
4. Verify `https://<project>.vercel.app/healthz` returns `{"ok":true,...}`.

Notes on serverless: the brute-force rate limiter is in-memory, so it does not
persist across function invocations; and sketch uploads must stay under
Vercel's ~4.5 MB request-body limit (the app caps PNGs at 4 MB).

## Mobile

```bash
cd mobile
npm install
npm test                        # pure-logic tests (API client refresh, share helpers)
```

Set the API URL in `mobile/app.json` → `expo.extra.apiUrl` (use the deployed
Vercel URL — a real device cannot reach `localhost`).

The app uses native modules (Skia, tentap, gesture-handler), so it needs a dev
build, not Expo Go:

```bash
npx expo run:android            # local dev build on a connected device/emulator
```

### Build the APK (needs a free Expo account)

```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview   # produces an installable APK to sideload
```

## Known v1 limits (by design)

- No password reset — a forgotten password locks that account out of its notes.
- Sketches save as flattened PNGs: reopening lets you draw on top, not undo old
  strokes; the eraser paints white rather than truly erasing.
- Android APK only (the Expo code stays iOS-capable but untested there).
