# Setup

This guide covers everything from running the app on your laptop to putting a new client live on Cloudflare.
For how shop owners and staff use the app, see [usage.md](usage.md).

- [How it fits together](#how-it-fits-together)
- [Prerequisites](#prerequisites)
- [Run it locally](#run-it-locally)
- [Cloudflare account (one time)](#cloudflare-account-one-time)
- [Add a new client](#add-a-new-client)
- [Design per client](#design-per-client)
- [Custom domain](#custom-domain)
- [Bot protection (Turnstile)](#bot-protection-turnstile)
- [Update all clients](#update-all-clients)
- [Automatic deploys from GitHub](#automatic-deploys-from-github)
- [Database changes](#database-changes)
- [Backups and restore](#backups-and-restore)
- [Configuration reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)

---

## How it fits together

One codebase, one deployment per client. Every client gets their own:

| Piece | Cloudflare product | Name |
|---|---|---|
| Website and dashboard | Worker (Next.js via OpenNext) | `<slug>` |
| Database | D1 (SQLite) | `<slug>-db` |
| Photos (logo, cover, products, staff) | R2 bucket | `<slug>-media` |
| Settings file | `deployments/<slug>.jsonc` in this repo | |

The app is built **once** and the same build is deployed to every client. Everything that differs between
clients is either a Wrangler **var** in `deployments/<slug>.jsonc` (language, time zone, Turnstile key)
or **data** in that client's database (design, name, links, services, prices, hours, products, staff).

A Cloudflare cron trigger runs every 15 minutes to mark unapproved bookings as expired (see `worker.ts`).

---

## Prerequisites

- **Node.js 24** and npm.
- **Git**.
- A **Cloudflare account** (free to create) for deploying. Not needed for local development.
- **Windows:** use **WSL** (Ubuntu) for builds and deploys. OpenNext warns that native Windows builds
  can fail in unpredictable ways. Local development with `npm run dev` works on Windows as well.

---

## Run it locally

```bash
git clone <repo-url> barber-sys
cd barber-sys
npm install
cp .dev.vars.example .dev.vars
```

Create the local database, add demo content and create a login:

```bash
npm run db:migrate:local
npm run db:seed:local
npm run owner:local -- --email owner@example.com --name "Demo Owner" --password local-dev-only
```

Start the dev server:

```bash
npm run dev
```

- Public page: <http://localhost:3000>
- Booking: <http://localhost:3000/book>
- Dashboard: <http://localhost:3000/admin> (log in with the account you just created)

`npm run dev` runs Next.js with local versions of the Cloudflare bindings (D1, R2), stored in `.wrangler/state`.
Delete that folder to start over with an empty database.

The demo seed creates a shop called "Abu Ali Barbershop" with two service types (Barbershop, Tattoo),
services with options, two staff members with working hours, links and products.
Skip `db:seed:local` if you want to start empty.

### Checks

```bash
npm run check        # lint + typecheck + unit tests
npm run preview      # production build running in the real Workers runtime (workerd), on port 8787
```

`npm run preview` is the closest thing to production. Use it before deploying anything big.

### Local settings

`wrangler.jsonc` is the development config. Change its `vars` to try another language or time zone locally,
e.g. `"DEFAULT_LOCALE": "en"`, then restart `npm run dev`. To try another design, pick it in the dashboard under
**Page & links → Design**; it applies right away.

If you change bindings or vars in `wrangler.jsonc`, regenerate the TypeScript types:

```bash
npm run cf-typegen
```

---

## Cloudflare account (one time)

1. Create an account at <https://dash.cloudflare.com/sign-up>.
2. Log in from the terminal:

   ```bash
   npx wrangler login
   ```

3. Enable **R2** in the dashboard (R2 Object Storage → Purchase / Enable). The free tier needs a card on file
   but includes 10 GB storage with no egress fees.
4. **Plan:** you can start on **Workers Free**, but switch to **Workers Paid ($5/month per account, covering all
   clients)** before the first real client:
   - Free allows **10 ms of CPU per request**. Server-rendered pages can go over that.
   - Free allows **10 D1 databases** per account, so at most about 10 clients.
   - Free allows **100,000 requests per day** shared by all clients.

   Workers Paid raises all of these well beyond what a shop needs.

---

## Add a new client

Pick a short **slug** (3-40 lowercase letters, digits or dashes), e.g. `abu-ali`. It becomes the Worker name and
the default address `https://abu-ali.<your-subdomain>.workers.dev`.

### 1. Create the resources

```bash
npm run client:new -- abu-ali --theme noir --locale ar
```

Options:

| Flag | Default | Meaning |
|---|---|---|
| `--theme` | `classic` | Starting design preset, see [Design per client](#design-per-client) |
| `--primary` | (preset) | Starting main brand color, e.g. `"#c9a227"` |
| `--accent` | (preset) | Starting soft background accent color |
| `--locale` | `ar` | Language for first-time visitors (`ar` or `en`) |
| `--timezone` | `Asia/Jerusalem` | Shop time zone (IANA name) |

This creates the D1 database and R2 bucket, writes `deployments/abu-ali.jsonc`, applies the database
migrations and saves the design flags (if any) in the database. **Commit the new file**: it holds no secrets.

### 2. Deploy

```bash
npm run client:deploy -- abu-ali
```

This builds the app, applies any pending migrations and deploys the Worker. The command prints the live URL.

### 3. Create the owner login

```bash
npm run client:owner -- abu-ali --email owner@example.com --name "Abu Ali"
```

Without `--password`, a random password is generated and printed **once**. Share it with the owner and ask them
to change it under **Account**. Running the command again for the same email resets that password.

### 4. Set up the shop

Log in at `https://<address>/admin` and follow the first-time checklist in [usage.md](usage.md#first-time-setup):
profile and links, service types and services, staff and hours, then settings.

> **Demo content for a client:** `node scripts/seed.mjs abu-ali` fills an *empty* client database with the demo shop.
> Useful for a sales demo; don't use it for a real shop.

---

## Design per client

Each shop's design is stored in its own database (the `design` document in the `config` table) and picked in the
dashboard under **Page & links → Design**, with a live preview. Saving applies it right away, to the public page and
the dashboard. No redeploy, no restart and no change in this repo.

Owners can change it themselves, and you can set it for them by logging in as an owner. To start a new client with a
design already chosen, pass `--theme`, `--primary` and `--accent` to `npm run client:new`.

| Preset | Look |
|---|---|
| `classic` | Light, warm cream with burnt orange (default) |
| `noir` | Dark, black with gold |
| `ocean` | Light, cool blue-teal |
| `rose` | Light, soft pink with rounded corners |
| `forest` | Light, olive green |
| `ink` | Dark, sharp corners with red (good for tattoo studios) |

- **Main color** overrides the preset's main color (buttons, highlights). Text on it switches between black and
  white automatically for contrast.
- **Accent color** overrides the soft accent surface color.
- Without a custom color, the preset's own color is used.

The presets live in `src/lib/theme.ts`. Add new presets there (and their names in `messages/*.json` under
`admin.design.themes`); every client can pick them after the next deploy. A shop without a saved design gets
`classic`.

---

## Custom domain

1. Add the client's domain to Cloudflare (Websites → Add a site) and point its nameservers to Cloudflare,
   or use a subdomain of a domain you already manage there.
2. Add a route to `deployments/<slug>.jsonc`:

   ```jsonc
   "routes": [{ "pattern": "book.abuali.com", "custom_domain": true }]
   ```

3. Deploy again: `npm run client:deploy -- <slug>`.

The `workers.dev` address keeps working. To turn it off, add `"workers_dev": false`.

---

## Bot protection (Turnstile)

Turnstile is Cloudflare's free CAPTCHA alternative. With it on, the booking form and the login page check that the
visitor is human. Without it, the app still works and limits bookings per phone number.

1. Dashboard → **Turnstile** → **Add widget**. Add the client's hostnames (`abu-ali.<you>.workers.dev` and any
   custom domain). Mode: **Managed**.
2. Put the **site key** in `deployments/<slug>.jsonc`:

   ```jsonc
   "TURNSTILE_SITE_KEY": "0x4AAAAAAA..."
   ```

3. Store the **secret key** as a secret (after the first deploy):

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY --config deployments/abu-ali.jsonc
   ```

4. Deploy again.

One widget can cover several clients' hostnames. Locally, leave both empty, or use Cloudflare's test keys
(site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`, which always pass).

---

## Update all clients

After merging changes to `main`:

```bash
npm run client:deploy -- --all
```

This builds once, then for each file in `deployments/` applies new database migrations and deploys.
If one client fails, the others still deploy and the failures are listed at the end.

Deploy only some clients:

```bash
npm run client:deploy -- abu-ali ink-studio
```

Re-deploy without rebuilding (e.g. after changing only vars):

```bash
npm run client:deploy -- abu-ali --skip-build
```

---

## Automatic deploys from GitHub

`.github/workflows/ci.yml` runs lint, typecheck, tests and a production build on every pull request.
`.github/workflows/deploy.yml` deploys all clients when `main` changes. To turn it on:

1. Create an API token: dashboard → My Profile → API Tokens → **Create Token** → template **Edit Cloudflare Workers**.
   Add the permissions **D1: Edit** and **Workers R2 Storage: Edit**.
2. In GitHub: Settings → Secrets and variables → Actions:
   - Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (shown on the dashboard's Workers overview page).
   - Variables: `DEPLOY_ENABLED` = `true`.
3. Push to `main`, or run the **Deploy** workflow by hand (Actions tab) and optionally list client slugs.

New clients are still created from your machine with `npm run client:new`. Commit the generated file and the
pipeline takes it from there.

---

## Database changes

The schema lives in `src/db/schema.ts` (Drizzle ORM). To change it:

1. Edit `src/db/schema.ts`.
2. Generate a migration:

   ```bash
   npm run db:generate
   ```

   This writes a new SQL file to `drizzle/`. Read it before committing.
3. Apply it locally: `npm run db:migrate:local`.
4. Deploying (`client:deploy`) applies it to every client automatically.

Rules that keep upgrades safe across many clients:

- Prefer **adding** columns with defaults over renaming or dropping.
- Never edit a migration that has already been deployed. Add a new one.
- Shop **settings** and **profile** fields are stored as JSON with defaults (`src/lib/config.ts`). Adding a setting
  there needs no migration at all.

---

## Backups and restore

D1 keeps a point-in-time history automatically (**Time Travel**: 7 days on Free, 30 days on Paid).

```bash
# Where would we restore to?
npx wrangler d1 time-travel info abu-ali-db --config deployments/abu-ali.jsonc

# Restore to a moment (ISO time or Unix timestamp)
npx wrangler d1 time-travel restore abu-ali-db --timestamp=2026-10-12T08:00:00Z --config deployments/abu-ali.jsonc
```

For an offline copy:

```bash
npx wrangler d1 export abu-ali-db --remote --output=abu-ali-backup.sql --config deployments/abu-ali.jsonc
```

Photos in R2 are not versioned. They are only deleted when the owner removes them in the dashboard.

---

## Configuration reference

### Vars (`deployments/<slug>.jsonc` → `vars`)

| Var | Example | Purpose |
|---|---|---|
| `DEFAULT_LOCALE` | `ar` | Language for visitors who haven't picked one |
| `TIMEZONE` | `Asia/Jerusalem` | Time zone for hours, slots and dates. Don't change it once a shop has bookings. |
| `TURNSTILE_SITE_KEY` | `0x4AAA...` | Optional Turnstile site key |

### Secrets (`wrangler secret put ... --config deployments/<slug>.jsonc`)

| Secret | Purpose |
|---|---|
| `TURNSTILE_SECRET_KEY` | Optional Turnstile secret. Without it, bot checks are skipped. |

### Bindings

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 | All data |
| `MEDIA` | R2 | Uploaded photos, served at `/media/...` |
| `ASSETS` | Assets | Built static files |
| `WORKER_SELF_REFERENCE` | Service | Required by OpenNext |

### Shop settings (in the dashboard, stored in the database)

Booking mode (instant or approval), how long pending bookings hold their slot, slot length mode, start-time grid,
minimum notice, how far ahead people can book, cancellation window, bookings per phone, staff choice,
phone country code and currency. See [usage.md → Settings](usage.md#settings).

The design (preset and colors) is under **Page & links → Design**. See [Design per client](#design-per-client).

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local development server |
| `npm run check` | Lint, typecheck, unit tests |
| `npm run preview` | Production build in the local Workers runtime |
| `npm run db:generate` | New migration from schema changes |
| `npm run db:migrate:local` | Apply migrations to the local database |
| `npm run db:seed:local` | Demo content in the local database |
| `npm run owner:local -- --email ...` | Create or reset a local owner login |
| `npm run client:new -- <slug> [flags]` | Create a client's database, bucket and config |
| `npm run client:deploy -- <slug>... \| --all` | Build, migrate and deploy |
| `npm run client:owner -- <slug> --email ...` | Create or reset a client's owner login |
| `npm run cf-typegen` | Regenerate `cloudflare-env.d.ts` after changing `wrangler.jsonc` |

---

## Troubleshooting

**Pages fail with error 1102 / "exceeded CPU" on a live site.**
The account is on Workers Free (10 ms CPU limit). Switch to Workers Paid.

**`client:new` says the database already exists.**
A previous run stopped halfway. Delete the leftovers with `npx wrangler d1 delete <slug>-db` and
`npx wrangler r2 bucket delete <slug>-media`, or pick another slug.

**Booking page says "Online booking isn't available yet".**
No service is both *visible* and *bookable online* with at least one *active staff member* assigned to it.
Check Services and Staff in the dashboard.

**No free times on any day.**
Check the staff member's working hours (Staff → person → Working hours), the time off list, and the settings for
minimum notice and booking horizon.

**Times look shifted by an hour.**
`TIMEZONE` doesn't match where the shop is.

**Images don't upload.**
R2 must be enabled on the account and the bucket in the config must exist (`npx wrangler r2 bucket list`).
Uploads are limited to 5 MB after in-browser resizing (JPG, PNG or WebP).

**Forgot the owner password.**
Run `npm run client:owner -- <slug> --email <their email>` to set a new one.

**Build fails on Windows.**
Use WSL. OpenNext doesn't fully support native Windows builds.
