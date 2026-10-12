# Decisions

| # | Topic | Decision |
|---|-------|----------|
| A | Languages | Arabic (RTL) and English from day one, with a language switch. Content fields are bilingual; an empty language falls back to the other |
| B | Booking confirmation | Both modes, configurable per shop: instant or barber approval (default: approval) |
| C | Phone verification | None for MVP. Limit upcoming bookings per phone number, plus optional Turnstile bot checks |
| D | Slot logic | Configurable per shop: per-service duration (default) or fixed slot length |
| E | Multi-staff | Any number of staff per shop. Customers pick a person or "anyone available" (configurable) |
| F | Walk-ins | App coexists with walk-ins: "add walk-in" and "block time" in the dashboard |
| G | Pricing | Free for the first shops for 2-3 months, then a flat monthly fee (TBD after talking to shops) |
| H | WhatsApp | MVP uses free `wa.me` links with pre-filled messages, both customer → shop and shop → customer. Official WhatsApp Business API later |
| I | Stack | Next.js 16 on Cloudflare Workers (OpenNext), D1 + Drizzle, R2, Tailwind, next-intl. Replaces Supabase + Vercel: Vercel's free plan forbids commercial use, and one provider keeps deploys simple |
| J | Settings approach | Settings and profile stored as JSON with per-field defaults (Zod). New settings need no migration; UI added per setting when a shop needs it |
| K | Admin | Two dashboard roles per shop: owner (everything) and staff (own calendar). The cross-shop "super admin" is the deploy tooling (`scripts/`), since each shop is its own deployment |
| L | Launch plan | Build for many shops, pilot with one shop first |
| M | Services | Name and description (AR/EN), price or "price on request", "from" price, duration, buffer, type, visible, bookable online, display order |
| N | Combos and options | Each service can have option groups: single or multiple choice, optional or required, each option adding price and minutes (e.g. "+ beard"). Replaces "combos as separate services" |
| O | Booking history | Each booking stores a snapshot of service name, options, price and duration. Services with history are archived, never deleted |
| P | Currency | Shekel (₪) by default, configurable |
| Q | Tenancy | One deployment per client: own Worker, D1 database and R2 bucket. Simple isolation, per-client domain and design. All clients are updated from one build with `client:deploy --all` |
| R | Design per client | Theme preset and color overrides are Wrangler vars, read at request time (redeploy only, no rebuild). Branding content (name, logo, links) is data the owner edits |
| S | Service types | Admin-defined types (Barbershop, Tattoo, Hair…) group services, so one system serves any appointment business |
| T | Customer identity | No customer accounts or anonymous login. Name + phone, and a private, unguessable link per booking to view, reschedule or cancel |
| U | Pending bookings | A pending booking holds its slot until approved, declined or expired (default 12 h). Availability ignores expired ones immediately; a cron marks them expired |
| V | Double booking | Bookings are written with a single conditional SQL statement (insert only if no overlap). D1 runs writes one at a time, so concurrent requests can't both win |
| W | Admin auth | Built-in email/password with PBKDF2 (WebCrypto) and database sessions. Cheap on the Workers CPU budget and no extra service to configure per client |
| X | Images | Resized to WebP in the browser before upload, stored in R2, served by the app with long cache headers. No paid image service |
| Y | Products | Catalog only, with "Ask on WhatsApp". No cart or online payment in the MVP |
| Z | Versions | Next.js pinned to 16.3.x, the line OpenNext supports. Upgrade only after `npm run preview` passes |

## Open questions

- Per-staff price and duration overrides: needed once a shop has a senior/junior barber split?
- Deposits for tattoo bookings (local wallets or bank apps)
- Final product name and domain
- Pricing amount and how it is collected locally
- Real services, prices, durations and hours from the first shop
- First shop's current no-show rate and walk-in share
