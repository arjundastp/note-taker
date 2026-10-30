# Notes App — Design

Date: 2026-10-30
Status: Draft for approval

## Intent and the why

A personal note-taking mobile app, Apple Notes-style, that the user opens to
jot things fast and to revisit older notes. The point is low-friction capture
and a clean, familiar reading/editing experience — not a heavyweight organizer.
Delivered as an installable Android APK.

## Goals

- Open straight to a list of recent notes (most-recently-updated first).
- Create/edit notes with rich formatting: headings, bold/italic, bullet lists,
  numbered lists.
- Each note shows its created and last-edited dates (no user-set date field).
- Pin notes so they stay at the top.
- Sketch notes: a drawing canvas the user inks on with a finger or Samsung
  S-Pen, saved as an image.
- Share a note three ways: copy as plain text, export as a `.md` file, export
  as a PDF.
- Email + password auth with a one-time registration. After first login the app
  stays signed in across launches (no login each open).
- Data stored server-side in Neon Postgres so notes survive reinstalls.

## Non-goals

- No handwriting-to-text recognition (ink is saved as an image only).
- No inline ink woven between paragraphs. A note is **either** a text note
  **or** a sketch note.
- No real-time sync / collaboration / sharing between users.
- No folders, tags, or search in v1 (recent-first list + pin is enough).
- No OTP / SMS login.
- No password reset / account recovery in v1. A forgotten password means that
  account's notes are unreachable — accepted risk for v1, revisit later (would
  need an email-sending service).
- No separate user-set note date; only created/edited timestamps.
- No offline-first conflict resolution. The app needs network to load/save;
  basic "last write wins" only.
- No iOS build in v1 (Android APK is the deliverable; the Expo codebase stays
  iOS-capable but untested there).

## Anti-goals (would make this a failure even if it "works")

- Login friction on every launch.
- A sluggish or janky editor — typing and inking must feel immediate.
- Losing a note the user wrote (silent save failures).

## Constraints

- Backend: Neon Postgres.
- Mobile: React Native.
- Must produce an Android APK.
- Reuse the auth approach already proven in the sibling `vehicle-service-tracker`
  repo rather than inventing a new one.

## The how — decided (builder's calls unless noted)

**Mobile app — Expo (React Native) + TypeScript.** Chosen for the simplest APK
builds (EAS Build) and because `expo-print` gives clean PDF export and
`expo-secure-store` gives persisted login out of the box. **Deliverable is an
EAS internal-distribution APK to sideload**, not a Play Store release.

**Title** = the note's first line (Apple Notes-style), not a separate field.
The client sets a denormalized `title` from the first line on each save so the
list can render quickly; the user never edits a title directly.

- **Rich text editor:** `@10play/tentap-editor` (maintained, supports headings,
  bold/italic, bullet + numbered lists). Note body stored as HTML.
- **Drawing canvas:** `@shopify/react-native-skia`. Strokes captured from touch
  (finger or S-Pen — the S-Pen reports as touch, so no special SDK needed). On
  save, the canvas is flattened to a PNG and uploaded; the PNG is what's stored
  and re-displayed. *(ponytail: storing a flattened PNG, not editable strokes —
  re-opening a sketch lets you draw on top, not undo old strokes. Upgrade to
  stored stroke data only if editing existing ink becomes a requirement.)*
- **Share — text notes:** copy via `expo-clipboard` (strip HTML to text); `.md`
  via a small HTML→Markdown step written to a temp file and shared with
  `expo-sharing`; PDF via `expo-print` (render the note HTML to PDF) +
  `expo-sharing`.
- **Share — sketch notes:** PDF (the image on a page) and share-as-image only;
  copy-text and `.md` do not apply.
- **Persisted login:** JWT access + refresh tokens; refresh token in
  `expo-secure-store`. On launch, if a refresh token exists, silently get a new
  access token — no login screen.
- **Navigation:** `expo-router` (list → note editor → sketch editor).

**Backend — Node/Express + Prisma + Neon Postgres**, mirroring
`vehicle-service-tracker/apps/api`: `hashPassword` / `verifyPassword`,
`signAccessToken`, `requireAuth` middleware, `errorHandler`, rate limiting on
auth. Deployed the same way the existing repo is (render.yaml pattern).

- **Sketch image storage:** images uploaded to the API and stored as rows the
  API serves back (base64/bytea or a small object store). *(Builder's call at
  implementation time; simplest that works — likely a presigned-upload pattern
  like the existing `attachments` service, or inline bytes for v1.)*

### Data model

- `User(id, email unique, passwordHash, createdAt)`
- `Note(id, userId FK, kind: 'text' | 'sketch', title (auto = first line),
  bodyHtml (text notes), imageRef (sketch notes), isPinned bool, createdAt,
  updatedAt)`

List ordering: pinned first, then `updatedAt` desc.

### API surface (sketch)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- `GET /notes` (recent-first, pinned on top)
- `POST /notes`, `GET /notes/:id`, `PATCH /notes/:id`, `DELETE /notes/:id`
- `PATCH /notes/:id/pin`
- Sketch image upload/download endpoints (shape = builder's call per above)

### Verification

- Backend: a small test for auth (register → login → refresh) and for note CRUD
  + pin ordering + per-user isolation (one user can't read another's notes).
- Mobile: manual run on an Android device/emulator for the editor, sketch, and
  the three share paths. No heavy mobile test harness in v1.

## Left to the builder

- Exact sketch-image storage mechanism (inline bytes vs presigned object store).
- Visual polish / theming to match Apple Notes feel (fonts, spacing, colors).
- Token TTLs and refresh rotation details (reuse existing repo's values).
- Error/empty/loading states copy.
- Project/package layout (monorepo vs two folders).
