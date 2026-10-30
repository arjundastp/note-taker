# Notes App

Apple Notes-style note taking: rich-text notes and ink sketch notes, pin, share
(copy / Markdown / PDF / image), email+password login that stays signed in.

- `api/` — Node + Express + Prisma + Postgres (Neon in production).
- `mobile/` — Expo (React Native) app, built to an Android APK.

Design: [docs/2026-10-30-notes-app-design.md](docs/2026-10-30-notes-app-design.md).
Plan: [docs/superpowers/plans/2026-10-30-notes-app.md](docs/superpowers/plans/2026-10-30-notes-app.md).

## API

```bash
cd api
cp .env.example .env            # paste your Neon DATABASE_URL + DIRECT_URL, set JWT_SECRET
npm install
npx prisma migrate deploy       # or `migrate dev` locally
npm run dev                     # http://localhost:3000
npm test                        # 17 tests (needs a Postgres; see .env.test)
```

Deploy like the sibling `vehicle-service-tracker` (see repo-root `render.yaml`):
a Node web service running `npm run build` then `npm start`, with `DATABASE_URL`,
`DIRECT_URL`, and `JWT_SECRET` set. Run `prisma migrate deploy` on release.

## Mobile

```bash
cd mobile
npm install
npm test                        # pure-logic tests (api client refresh, share helpers)
```

Set the API URL the app talks to in `mobile/app.json` → `expo.extra.apiUrl`
(a real device cannot reach `localhost` — use your deployed API's URL).

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
eas build -p android --profile preview   # produces an installable APK
```

Download the APK from the build page and sideload it.

## Known v1 limits (by design)

- No password reset — a forgotten password locks that account out of its notes.
- Sketches save as flattened PNGs: reopening lets you draw on top, not undo old
  strokes; the eraser paints white rather than truly erasing.
- Android APK only (the Expo code stays iOS-capable but untested there).
