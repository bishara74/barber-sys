# barber-sys

A booking site and link-in-bio page for small service businesses: barbershops, tattoo studios, hair stylists.
Built for shops in Bethlehem and the West Bank, in Arabic and English.

Customers open the shop's page, see its links, services, prices and products, and book from their phone with no
account. The shop manages bookings, services, staff and its page from a simple dashboard. Confirmations go over
WhatsApp.

Each client gets their own deployment on Cloudflare, with their own database, photo storage and design.

## Features

- **Public page** in the style of a link in bio: cover, logo, social icons, link buttons, services and prices,
  products with photos, opening hours with an "open now" status, and one-tap directions, call and WhatsApp.
- **Booking** in five short steps: service, options (add-ons with extra price and time), person or "anyone",
  day and time, name and phone. Confirmation link to reschedule, cancel, add to calendar or message the shop on WhatsApp.
- **Availability engine**: working hours with breaks, time off, buffers, minimum notice, booking horizon, fixed or
  per-service slot lengths. No double booking, even under concurrent requests.
- **Approval mode**: pending bookings hold their slot until approved, declined or expired.
- **Dashboard**: today's agenda and approvals, day/week/month calendar, walk-ins and phone bookings, moving and
  status changes, ready-made WhatsApp messages, time off, services with option groups, products with photos,
  page and links, staff and hours, customers with history, settings, owner and staff logins.
- **Arabic (RTL) and English** throughout, with a language switch.
- **Per-client design** picked by the owner in the dashboard: six theme presets plus color overrides, with a live preview,
  and the shop's own browser tab icon (favicon).
- **Mobile-first interface** with light, CSS-only motion: fade-ins, a parallax cover and a compact header on scroll,
  all switched off for people who prefer reduced motion. A bottom tab bar in the dashboard on phones.

## Stack

| | |
|---|---|
| App | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4, CSS-variable themes |
| Hosting | Cloudflare Workers via OpenNext |
| Database | Cloudflare D1 (SQLite) with Drizzle ORM |
| Photos | Cloudflare R2, resized in the browser before upload |
| i18n | next-intl |
| Bot protection | Cloudflare Turnstile (optional) |
| Tests | Vitest |

## Quick start

```bash
npm install
npm run setup:local
npm run dev
```

`setup:local` creates `.dev.vars`, the local database, a demo shop with customers and bookings around today, and a
login. Open <http://localhost:3000> and <http://localhost:3000/admin> (`owner@example.com` / `local-dev-only`).
`npm run reset:local` starts over from a fresh demo. See [Run it locally](docs/setup.md#run-it-locally).

## Tests

```bash
npm run check              # lint, route types, TypeScript, and fast unit tests
npm test                   # unit tests only
npm run test:integration    # booking rules against isolated local Miniflare D1
npx playwright install --with-deps chromium
npm run reset:local        # stop any dev/preview server first; wipes local demo data/photos
npm run test:e2e            # starts npm run dev automatically on localhost:3000
```

Integration tests apply the committed migrations to an ephemeral D1 database and seed their own fixtures.
They do not use the demo database, Cloudflare credentials, or remote services. `npm test` stays independent of
Miniflare and browsers.

Browser tests share the local demo database and use the demo owner login. They create fresh customers and
bookings, remove their records afterward, and restore changed settings even after failures. They use the shop's
`Asia/Jerusalem` time zone and search from tomorrow for the first date with free slots; Friday stays closed.
The language test starts without a locale cookie; other tests use English. Stop the server before each reset.
An existing local dev server can be reused, but must point to this freshly reset demo.

To check repeatability without retries:

```bash
npm run test:e2e -- --repeat-each=3 --retries=0
```

Failures retain screenshots/traces in `test-results/` and an HTML report in `playwright-report/`:
`npx playwright show-report`. CI runs integration and browser tests in a separate job and uploads the browser
report on failure. These generated directories are ignored by Git.

## Docs

- [Setup](docs/setup.md): local development, Cloudflare, adding and deploying clients, themes, domains, backups.
- [Usage](docs/usage.md): the guide for shop owners and staff.
- [Decisions](docs/decisions.md): what was decided and why.
- [Features](docs/features.md): what's built and what's next.
- [Data model](docs/data-model.md): tables and how bookings work.

## Repo layout

```
src/
  app/            Pages and routes: public page, /book, /booking/[token], /admin/*, /api/slots, /media
  actions/        Server Actions (forms and mutations)
  components/     UI: ui/ (building blocks), public/ (booking), admin/ (dashboard)
  db/             Drizzle schema and client
  i18n/           Locale setup
  lib/            Business logic: availability, bookings, catalog, auth, config, themes
messages/         Translations (en.json, ar.json)
drizzle/          SQL migrations
deployments/      One Wrangler config per client
scripts/          new-client, deploy, create-owner, seed
worker.ts         Worker entry: the app plus the cron job
wrangler.jsonc    Local development config
```

## Working agreement

- Work in branches, open pull requests, review each other's PRs. CI runs lint, typecheck, tests and a build.
- Every feature is a GitHub Issue, grouped into milestones: MVP, Pilot, Phase 2.
- Settings have defaults first; UI for a setting is built only when a shop needs it.
- `npm run check` before pushing.
