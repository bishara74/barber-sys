# Data model

Defined in [`src/db/schema.ts`](../src/db/schema.ts) (Drizzle ORM, SQLite on Cloudflare D1).
Money is stored in minor units (agorot): `4500` = ₪45. Times are stored as UTC milliseconds and shown in the shop's
`TIMEZONE`. Weekly hours are minutes from local midnight.

## Tables

| Table | Holds |
|---|---|
| `config` | Three JSON documents: `profile` (name, texts, phone, WhatsApp, logo, cover, tab icon), `settings` (booking rules) and `design` (theme preset and color overrides). Validated with defaults in `src/lib/config.ts` |
| `users` | Dashboard logins: email, PBKDF2 password hash, role (`owner` / `staff`), optional linked staff member |
| `sessions` | Login sessions; the id is the SHA-256 of the cookie token |
| `links` | Social icons (`kind = social`, `platform`) and link buttons (`kind = button`, bilingual label) |
| `products`, `product_images` | Catalog items and their photos (R2 keys) |
| `service_types` | Groups such as Barbershop or Tattoo |
| `services` | Bookable services: price (null = on request), duration, buffer, flags, order |
| `option_groups`, `options` | Choices under a service; each option adds price and minutes |
| `staff`, `staff_services` | People who take appointments and the services each one does |
| `working_hours` | Weekly shifts per staff member; two shifts on a day make a break |
| `time_off` | Blocked periods for one person, or the whole shop when `staff_id` is null |
| `customers` | Name, phone (digits, international format, unique) and notes |
| `bookings` | Appointments, see below |

## Bookings

A booking stores a **snapshot** of what was booked (service names, chosen options, total price, duration), so later
catalog changes never rewrite history.

| Column | Meaning |
|---|---|
| `token` | Secret for the customer's private link |
| `starts_at`, `ends_at` | The appointment (in fixed-slot mode, rounded up to whole slots) |
| `blocked_until` | `ends_at` plus the service buffer; the staff member is busy until then |
| `status` | `pending`, `confirmed`, `completed`, `no_show`, `cancelled`, `declined`, `expired` |
| `pending_expires_at` | When an unapproved booking stops holding its slot |
| `source` | `online`, `admin` (phone booking) or `walk_in` |

A booking **occupies time** when it is `confirmed`, or `pending` and not yet past `pending_expires_at`.

### No double booking

New bookings are written with one statement:

```sql
INSERT INTO bookings (...) SELECT ...
WHERE NOT EXISTS (an occupying booking for the same staff member that overlaps)
  AND NOT EXISTS (time off that overlaps)        -- online bookings only
```

D1 executes writes one at a time, so when two customers submit the same slot together exactly one insert succeeds;
the other gets "that time was just taken". Moves and approvals use the same check as an `UPDATE ... WHERE NOT EXISTS`.

### Availability

`src/lib/availability.ts` is a pure function: for one date it walks each staff member's shifts in steps of the
start-time grid and keeps start times where the appointment fits inside the shift and the appointment plus its buffer
overlaps no busy period (bookings and time off). `src/lib/schedule.ts` loads the data for it.
