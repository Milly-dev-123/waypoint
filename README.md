# Waypoint

A consent-first location-sharing web app with two coordinated features:

1. **Private Circles** — small opt-in groups share live location and drop
   shared pins (meeting points, parking spots, "I'm here").
2. **Public Humanitarian Map** — a community map of places and services
   (water points, food distribution, shelters, charging stations,
   hazards, blocked roads). Pins are about **places**, never about
   individual people.

Waypoint is **not** an OSINT/surveillance tool. Sharing is always
user-initiated, time-limited, revocable, and visible to the person
sharing.

## Stack

- **Next.js 15** App Router + TypeScript + Tailwind CSS, React 18
- **Supabase** — Postgres + PostGIS, GoTrue auth, Realtime, pg_cron
- **Magic-link auth only** — no passwords, 13+ confirmation at signup
- **Leaflet 1.9** with CARTO Positron tiles (dev only — see Known issues)
- **Zod** for server-side input validation

## Project status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project scaffold, schema, magic-link auth, RLS, 24h purge | Shipped |
| 2A–2D | Live map, Circles CRUD, location sharing, realtime member positions | Shipped |
| 2E | Public Humanitarian pins UI (schema is in place) | Placeholder tab |
| 2F | Activity feed, profile / sessions / account-deletion settings | Placeholder tab |
| 3 | PWA install + Background Sync, production tile provider, nonce-based CSP | Backlog |

The `/app` shell already has all five tabs wired up; the three not-yet-built
tabs render a `Placeholder` describing what will land there.

---

## Local development on macOS

### One-time setup

You need Homebrew, Node 18+, a Docker-compatible container runtime, and
the Supabase CLI.

```bash
# Container runtime (lighter than Docker Desktop on Mac, fully compatible)
brew install --cask orbstack

# Supabase CLI
brew install supabase/tap/supabase
```

### Install and configure

```bash
cd ~/Documents/CODE\ Dev/Waypoint
npm install
cp .env.local.example .env.local
```

### Start the local Supabase stack

```bash
npm run supabase:start
# Reads supabase/config.toml, pulls images, starts Postgres + GoTrue +
# Realtime + Studio + Inbucket. First run takes a few minutes.

npm run supabase:status
# Copy the printed API URL, anon key, and service_role key into .env.local.
```

Apply migrations and seed data:

```bash
npm run supabase:reset
```

### Run the Next.js dev server

```bash
npm run dev
# http://localhost:3000
```

### Local service URLs

| Service | URL | What it's for |
| --- | --- | --- |
| App | http://localhost:3000 | The Waypoint UI |
| Supabase API | http://127.0.0.1:54321 | Postgres + Auth + Realtime endpoint |
| Supabase Studio | http://127.0.0.1:54323 | Postgres GUI, table editor, SQL editor |
| Inbucket | http://127.0.0.1:54324 | Captures magic-link emails locally |

---

## End-to-end smoke test

This is the quickest way to confirm everything is wired up.

1. Visit `http://localhost:3000` → you're redirected to `/login`.
2. Click **Create an account**, fill in display name + email, tick the
   13+ checkbox, submit → you land on the **Check your email** page.
3. Open **Inbucket** (`http://127.0.0.1:54324`), find the message, and
   click the magic link.
4. You arrive on `/app` with the Map tab active and "Welcome, &lt;name&gt;".
5. Open the **Circles** tab, click **Create circle**, name it, and copy
   the 8-character invite code from the detail view.
6. Click the floating action button → **Start sharing**, pick the
   duration, confirm. The orange persistent banner appears at the top
   and your marker shows on the map within ~30s.
7. Open **Supabase Studio** (`http://127.0.0.1:54323`):
   - `auth.users` has your row.
   - `public.profiles` has a matching row with `age_confirmed_at` set.
   - `public.location_shares` has an `is_active = true` row.
   - New `public.location_points` rows appear every ~30 seconds.
8. In Studio's SQL editor, switching to the `anon` role and running
   `select * from public.location_points` returns zero rows (RLS).
9. Click **Stop sharing** in the banner → the banner clears, the
   `location_shares` row becomes `is_active = false`. Sign out from the
   user menu → back at `/login`. Hitting `/app` redirects to `/login`.

If all nine pass, the live, end-to-end flow is healthy.

---

## What's in the app

### `/app` shell

`AppShell` is a persistent map with a tab nav and a slide-over panel.
The map never unmounts — non-map tabs open as an overlay on top — so
switching tabs doesn't disturb an active share or reload the tile cache.

The five tabs are defined in `lib/app/tabs.ts`:

- **Map** — Leaflet map, your own marker, circle-mate markers via realtime
- **Circles** — list, create, join, view detail, leave
- **Public Pins** — placeholder (milestone 2E)
- **Activity** — placeholder (milestone 2F)
- **Settings** — placeholder (milestone 2F)

### Location sharing

`SharingProvider` (`components/sharing/SharingProvider.tsx`) owns active
share state and a 30-second write loop. It is mounted near the root of
`/app` so the loop survives tab switches.

- **Start**: pick one or more circles + a duration (`DurationPicker`),
  confirm in `StartSharingModal`. Server action calls the
  `start_location_share` RPC.
- **Tick**: every 30s, `recordLocationPoint` inserts a row into
  `location_points` via the `record_location_point` RPC. The point is
  only visible to circle members of the sharer.
- **Receive**: `ReceivedPositionsProvider` subscribes to the
  `location_points` realtime channel; Supabase applies RLS per
  subscriber so each client only sees points it's allowed to read.
- **Stop**: `stopSharing` flips `is_active = false`. If the tab closes
  without stopping, the share remains active until `expires_at`, at
  which point the pg_cron sweep (migration 8) deactivates it within
  ~5 minutes. Closing this gap is a Phase 3 item.
- **Reload-resume**: on mount, `SharingProvider` re-queries any active,
  unexpired shares and resumes the loop.

### Circles

Server actions in `lib/circles/actions.ts` wrap two `SECURITY DEFINER`
RPCs:

- `create_circle(_name)` — creates the circle and inserts the creator
  as a member in one transaction. Returns the row including the
  8-character invite code.
- `join_circle(_invite_code)` — atomic join with rate limiting; raises
  SQLSTATE 53400 if you've joined too many circles in the last hour.

A trigger (`migration 9`) deletes a circle automatically when its last
member leaves.

### Auth

Magic-link only.

- `/signup` → `SignupForm` → server action validates with Zod, calls
  `supabase.auth.signInWithOtp`, and stores `display_name` +
  `age_confirmed_at` in `raw_user_meta_data`. A DB trigger then creates
  the matching `public.profiles` row.
- `/login` → `MagicLinkForm`, same path minus the metadata.
- `/auth/callback` → exchanges the code for a session. Rejects
  open-redirect attempts by requiring `?next=` to be a same-origin path
  matching `/^\/[A-Za-z0-9/_\-?=&%.]*$/`.
- `/auth/logout` → POST → signs out → redirects to `/login`.
- `middleware.ts` runs on every page/route request and refreshes the
  Supabase session cookie.

Magic-link rate limits live in `supabase/config.toml`:

- 5 emails/hour per project
- 30 sign-in/sign-up attempts per 5 minutes per IP
- 150 token refreshes per 5 minutes

---

## Project layout

```
app/                         Next.js App Router
  (auth)/login                Magic-link sign-in
  (auth)/signup               Sign-up with age confirmation
  (auth)/check-email          Post-submission landing page
  (app)/app                   Protected app shell (renders AppShell)
  auth/callback               Magic-link exchange (open-redirect guarded)
  auth/logout                 POST → sign out

components/
  ui/                         Button, Input, Label, Card, Checkbox, FormMessage, SubmitButton
  auth/                       MagicLinkForm, SignupForm
  app/                        AppShell, TopBar, TabNav, TabPanel, UserMenu,
                              FloatingActionButton, SharingIndicator
  app/tabs/                   CirclesTab, CirclesList, CreateCircleForm,
                              JoinCircleForm, CircleDetail, CopyInviteButton,
                              Placeholder
  map/                        Map (plain Leaflet), MapClientOnly, MapContext,
                              LocateButton, MemberMarkers
  sharing/                    SharingProvider, SharingBanner, StartSharingModal,
                              CirclePicker, DurationPicker, ReceivedPositionsProvider

lib/
  supabase/                   Browser + server + middleware clients, env loader
  auth/                       Server actions, requireUser / requireProfile guards
  circles/                    Actions, queries, schema, types, form-state
  sharing/                    Actions, queries, schema, types
  app/                        Tab definitions
  validation/                 Zod schemas (auth)
  utils/cn.ts                 clsx + tailwind-merge helper

supabase/
  config.toml                 Local stack config + rate limits
  migrations/                 12 migrations, RLS-on, default-deny
  seed.sql                    Public pin categories
  snippets/                   SQL bookmarks for Studio

types/                       Generated Supabase types (run `supabase:types`)
middleware.ts                Refreshes the Supabase session on every request
next.config.mjs              CSP + security headers
tailwind.config.ts           Theme tokens, fonts, radii, shadows
```

Path alias: `@/*` → repo root (configured in `tsconfig.json`).

---

## Database schema

All twelve migrations live in `supabase/migrations/`. Every table has
RLS enabled and forced.

| # | File | What it adds |
| --- | --- | --- |
| 1 | `extensions` | postgis, pg_cron, pgcrypto |
| 2 | `profiles` | One row per `auth.users`, populated by a signup trigger that reads `raw_user_meta_data` |
| 3 | `circles` | `circles` + `circle_members`, invite codes, members-can-leave RLS |
| 4 | `location` | `location_shares` + `location_points` with PostGIS geography, can-see-location helper |
| 5 | `circle_pins` | Short-lived pins shared within one circle (max 7 days) |
| 6 | `public_pins` | Community humanitarian pins; categories table; places only |
| 7 | `audit_log` | Transparency log of who saw whose location and who acted on what |
| 8 | `cron_cleanup` | pg_cron jobs: 24h purge of points, deactivate expired shares, expire pins |
| 9 | `circle_orphan_cleanup` | Auto-delete a circle when its last member leaves |
| 10 | `create_circle_rpc` | `SECURITY DEFINER` create_circle — atomic create + first membership |
| 11 | `sharing_rpcs` | `start_location_share`, `stop_location_shares`, `record_location_point` |
| 12 | `realtime_positions` | Adds `location_points` to `supabase_realtime` publication |

Seed data (`supabase/seed.sql`) populates 12 public pin categories
(water, food, shelter, medical aid, charging, Wi-Fi, donation drop-off,
volunteer point, community event, hazard, blocked road, other).

**Regenerate types** after a schema change:

```bash
npm run supabase:types
# Writes types/database.ts
```

---

## Security posture

- Every table has RLS enabled and forced.
- All `SECURITY DEFINER` functions pin `search_path` to defend against
  schema-shadow attacks.
- Writes that depend on `auth.uid()` go through RPCs (`create_circle`,
  `join_circle`, `start_location_share`, `stop_location_shares`,
  `record_location_point`) rather than plain INSERTs — RPCs verify the
  auth boundary internally and avoid subtle RLS denials from the
  `@supabase/ssr` server client.
- The service-role key is never exposed to the browser. It's reserved
  for future server-side admin operations.
- All form input is validated server-side with Zod before any database
  call.
- Auth callback rejects open-redirect attempts.
- Strict CSP, `X-Frame-Options: DENY`, `Referrer-Policy:
  strict-origin-when-cross-origin`,
  `Permissions-Policy: geolocation=(self), camera=(), microphone=()`,
  HSTS for one year.
- Magic-link rate limits configured in `supabase/config.toml`.
- Realtime applies RLS per subscriber, so each client only receives
  the `location_points` inserts it is allowed to SELECT.
- `location_points` are purged 24h after recording by a pg_cron job —
  UI bugs cannot keep history beyond that window.
- Postgres SQLSTATE codes raised by RPCs are mapped to user-facing
  copy in server actions; raw codes never reach the client.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Next.js ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write across `**/*.{ts,tsx,js,jsx,json,md,sql,css}` |
| `npm run format:check` | Prettier check (CI-friendly) |
| `npm run supabase:start` | Start the local Supabase stack |
| `npm run supabase:stop` | Stop it |
| `npm run supabase:status` | Print local API URL + keys |
| `npm run supabase:reset` | Drop the DB and re-run all migrations + seed |
| `npm run supabase:types` | Regenerate `types/database.ts` |

---

## Working on Waypoint

### Conventions

- **Single-responsibility components**. Each component lives in its own
  file. Cross-cutting state lives in providers (`SharingProvider`,
  `ReceivedPositionsProvider`, `MapContext`).
- **Server actions over API routes**. Every mutation goes through a
  `'use server'` action in `lib/*/actions.ts`. The action validates
  with Zod, calls the appropriate RPC, maps known SQLSTATE codes to
  copy, and never leaks raw error details to the client.
- **RPCs over RLS-only INSERTs** for writes that depend on
  `auth.uid()`. See migration 10's commentary for why.
- **RLS on, always.** Any new table must `enable row level security`
  and `force row level security`, then add explicit policies.
- **No service-role key in the browser.** Server-side only.
- **Inputs are Zod-validated server-side** before any DB call, even
  when the client already validated.

### Common changes

**Adding a new tab.** Append to `TABS` in `lib/app/tabs.ts`, add a
heading + placeholder in `components/app/TabPanel.tsx`, then build the
real tab component under `components/app/tabs/` and wire it into
`TabPanel`. The map will keep rendering underneath without a remount.

**Adding a new public pin category.** Append to `supabase/seed.sql` and
run `npm run supabase:reset`. The categories table is upserted on
conflict, so existing categories keep their IDs.

**Adding a new migration.** Create
`supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`. Re-run
`npm run supabase:reset` to apply it locally. Always enable + force
RLS on new tables, and prefer a `SECURITY DEFINER` RPC for any
auth-dependent write.

**Adding an environment variable.** Add it to `.env.local.example`
with a comment explaining what it's for, then to your `.env.local`.
Anything the browser needs must be prefixed `NEXT_PUBLIC_`.

### Debugging tips

- Magic-link not arriving? Check Inbucket at
  `http://127.0.0.1:54324`. If it's empty, you've probably hit the
  5-emails-per-hour limit; `npm run supabase:reset` clears state.
- Sharing tick not firing? `SharingProvider` logs the loop state to
  the console; check the browser devtools and the `location_shares`
  table for an active row.
- RLS denying a read you expected? Run the query in Studio's SQL
  editor under the `anon` role to confirm RLS is the cause; the
  policies for that table are in the migration that created it.
- Map blank? CSP `img-src` only allows `basemaps.cartocdn.com`. If
  you swap tile providers, update `next.config.mjs` too.

---

## Known issues (logged, deferred)

- `npm audit` reports 2 moderate vulnerabilities in `postcss` (bundled
  under Next.js). The exploit path requires attacker-controlled CSS
  source and is not reachable in Waypoint. Will clear when Next ships
  a patch.
- ESLint 8 (shipped with Next 15) is past upstream support. Bumping is
  a Phase 3 hygiene task.
- CARTO Positron tiles are **dev-only**. Before any non-dev deployment,
  swap to MapTiler / Stadia Maps / self-hosted Protomaps and update
  the CSP `img-src` in `next.config.mjs`.
- CSP currently uses `'unsafe-inline' 'unsafe-eval'` in `script-src`
  for Next's hydration script. Tighten to a nonce-based CSP in
  Phase 3 once a server component emits one.
- If a user closes the tab without stopping sharing, the DB row stays
  `is_active = true` until `expires_at`. The pg_cron sweep
  (migration 8) reconciles within ~5 minutes. The real fix is a PWA
  Background Sync handler in Phase 3.
