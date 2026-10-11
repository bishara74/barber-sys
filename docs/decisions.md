# Decisions

| # | Topic | Decision |
|---|-------|----------|
| A | Languages | Arabic (RTL) and English from day one, with a language switch |
| B | Booking confirmation | Both modes, configurable per shop: instant or barber approval |
| C | Phone verification | None for MVP. Limit bookings per phone number instead |
| D | Slot logic | Configurable per shop: fixed slot length or per-service duration |
| E | Multi-barber | Configurable per shop |
| F | Walk-ins | App coexists with walk-ins: "block time" and "add walk-in" |
| G | Pricing | Free for the first shops for 2-3 months, then a flat monthly fee (TBD after talking to shops) |
| H | WhatsApp | MVP uses a free `wa.me` link with a pre-filled message. Official WhatsApp Business API later |
| I | Stack | Next.js, Tailwind, Supabase, Vercel |
| J | Settings approach | Settings model with defaults first. UI added per setting when a shop needs it |
| K | Admin | Two levels: shop settings (owner) and a super admin portal (founders only) |
| L | Launch plan | Build for many shops, pilot with one shop first |
| M | Services | Barber configures name (AR/EN), price, duration, category, active/hidden, bookable online |
| N | Combos | A combo (e.g. haircut + beard) is just its own service for the MVP. Multi-select is Phase 2 |
| O | Booking history | Each booking stores a snapshot of service name, price and duration. Services with history are archived, never deleted |
| P | Currency | Shekel (₪) by default |

## Open questions

- Per-barber price and duration overrides: in the MVP, or only when a second barber joins?
- Final product name and domain
- Pricing amount and how it is collected locally
- Real services, prices, durations and hours from the first shop
- First shop's current no-show rate and walk-in share
