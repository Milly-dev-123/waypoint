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

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres + PostGIS, GoTrue auth, Realtime, pg_cron
- Magic-link auth only (no passwords)
- react-leaflet (Phase 2)

## Phase 1 scope (this commit)

- Project scaffold with Tailwind theme and Plus Jakarta Sans + Inter fonts.
- Supabase local config + the full database schema with row-level
  security on every table.
- Magic-link sign-up (with required 13+ confirmation) and sign-in.
- Protected `/app` placeholder page.
- Cron jobs that purge location points after 24 hours.

The map, circles, and pin features arrive in Phase 2.

---

## Local dev on macOS

### One-time setup

You need: Homebrew, Node 18+, Docker-compatible container runtime, Supabase CLI.

```bash
# Container runtime (lighter than Docker Desktop on Mac, fully compatible)
brew install --cask orbstack

# Supabase CLI
brew install supabase/tap/supabase
```

### Install + configure the project

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
```

When it finishes, run:

```bash
npm run supabase:status
```

Copy the printed **API URL**, **anon key**, and **service_role key** into
`.env.local`.

Apply migrations + seed data:

```bash
npm run supabase:reset
```

### Run the Next.js dev server

```bash
npm run dev
# http://localhost:3000
```

### End-to-end smoke test

1. Visit `http://localhost:3000` → redirected to `/login`.
2. Click **Create an account**, fill in display name + email, tick the
   13+ checkbox, submit → **Check your email** page.
3. Open **Inbucket** at `http://127.0.0.1:54324`, find the message, click
   the magic link.
4. You land on `/app` with "Welcome, &lt;display name&gt;".
5. Open **Supabase Studio** at `http://127.0.0.1:54323`:
   - `auth.users` has your new row.
   - `public.profiles` has a matching row with `age_confirmed_at` set.
6. In Studio's SQL editor, switching to the `anon` role and running
   `select * from public.location_points` returns zero rows (RLS).
7. Click **Sign out** in the header → back at `/login`. Hitting `/app`
   again redirects to `/login`.

If all six pass, Phase 1 is done.

---

## Project layout

```
app/                         Next.js App Router
  (auth)/login                Magic-link sign-in
  (auth)/signup               Sign-up with age confirmation
  (auth)/check-email          Post-submission landing page
  (app)/app                   Protected placeholder for the main app shell
  auth/callback               Magic-link exchange
  auth/logout                 POST → sign out

components/                  Small, single-responsibility UI building blocks
  ui/                         Button, Input, Label, Card, Checkbox, FormMessage
  auth/                       MagicLinkForm, SignupForm, SubmitButton

lib/
  supabase/                   Browser + server + middleware clients
  auth/                       Server actions + session guards
  validation/                 Zod schemas
  utils/cn.ts                 clsx + tailwind-merge helper

supabase/
  config.toml                 Local stack config
  migrations/                 Schema (all RLS-on, all default-deny)
  seed.sql                    Public pin categories

middleware.ts                Refreshes the Supabase session on every request
next.config.mjs              CSP + security headers
```

## Security posture

- Every table has RLS enabled and forced.
- All SECURITY DEFINER functions pin `search_path` to defend against
  schema-shadow attacks.
- No service-role key is ever exposed to the browser.
- All form input is validated server-side with Zod before any database call.
- Auth callback rejects open-redirect attempts.
- Strict CSP, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Magic-link rate limits configured in `supabase/config.toml`.
- Location points are purged 24h after recording by a pg_cron job — UI
  bugs cannot keep history beyond that window.

## Known issues (logged, deferred)

- `npm audit` reports 2 moderate vulnerabilities in `postcss` (bundled
  under Next.js). The exploit path requires attacker-controlled CSS source
  and is not reachable in Waypoint. Will clear when Next ships a patch.
- ESLint 8 (shipped with Next 15) is past upstream support. Bumping is a
  Phase 2 hygiene task.
- OpenStreetMap tile servers are dev-only. Before any non-dev deployment,
  swap to MapTiler / Stadia Maps / self-hosted Protomaps.
