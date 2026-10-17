# Features

Milestones: **MVP** (first shop), **Pilot** (polish with 2-3 shops), **Phase 2**, **Later**.

## MVP

### Public page (link in bio)
- [x] Cover photo, logo, name, tagline, address with map link
- [x] Social icons (Instagram, TikTok, Facebook, Snapchat, WhatsApp, YouTube, X, Telegram, Threads, phone, email, maps, website)
- [x] Link buttons, reorderable and hideable
- [x] Services and prices grouped by type, with "call to book" for offline-only services
- [x] Products with photos, price, stock state and "Ask on WhatsApp"
- [x] Opening hours from staff working hours, with "open now / opens at" status
- [x] Directions, call and WhatsApp buttons
- [x] Link previews (Open Graph) with the shop's cover
- [x] Browser tab icon (favicon) uploaded by the owner, falling back to the logo or the shop's initial

### Customer booking
- [x] Booking page (`/book`), mobile-first, deep link to a service (`/book?service=3`)
- [x] Arabic (RTL) and English with a language switch
- [x] Service → options → person (skipped when only one) → date and time → details
- [x] Live total of price and duration while choosing options
- [x] Name and phone only, no account; remembered on the device for next time
- [x] Confirmation page with "Send to the shop on WhatsApp" (pre-filled `wa.me` message)
- [x] Private link to view, reschedule or cancel, until the cancellation window
- [x] Add to calendar (.ics)
- [x] Limit on upcoming bookings per phone number
- [x] Optional Cloudflare Turnstile bot check

### Services (shop-configurable)
- [x] Service types (e.g. Barbershop, Tattoo, Hair styling)
- [x] Name and description in Arabic and English
- [x] Price (₪), "from" price, price on request, free
- [x] Duration and buffer after
- [x] Visible / hidden, bookable online, display order
- [x] Option groups: single or multiple choice, required or optional, each option with extra price and minutes
- [x] Which staff members do each service
- [x] Archive instead of delete when a service has bookings
- [x] Bookings store a snapshot of service, options, price and duration

### Availability engine
- [x] Weekly working hours per staff member, with breaks as split shifts
- [x] Time off for one person or the whole shop
- [x] Per-service duration or fixed slot length
- [x] Start-time grid (5-60 min) and buffer between appointments
- [x] No double-booking, including under concurrent requests
- [x] Minimum notice and maximum days ahead
- [x] Correct across daylight-saving changes

### Dashboard
- [x] Login for owners and staff; staff see only their own bookings
- [x] Today: pending approvals, today's agenda, upcoming count, copyable booking link
- [x] Day (per staff), week and month calendar; tap an empty hour to book
- [x] Approve / decline; pending bookings hold their slot and expire
- [x] Cancel, move (time and person), mark completed or no-show
- [x] Add a walk-in or phone booking; block time
- [x] Ready-made WhatsApp messages to the customer (confirmed, reminder, declined, cancelled)
- [x] Private staff notes per booking
- [x] Customer list with search, visit history, notes, and delete (anonymizes bookings)
- [x] Products with multiple photos
- [x] Page and links editor
- [x] Staff with photo, services and working hours
- [x] Users: owners and staff accounts

### Per-shop settings (defaults first)
- [x] Booking mode: instant or approval, and how long pending bookings hold
- [x] Slot logic: per-service or fixed length; start-time grid
- [x] Staff choice on or off
- [x] Minimum notice, booking horizon, cancellation window
- [x] Max upcoming bookings per phone
- [x] Phone country code and currency
- [x] Shop info: name, address, map link, phone, WhatsApp, logo, cover

### Deployment
- [x] One deployment per client: Worker + D1 + R2, created by `npm run client:new`
- [x] Design per client, picked by the owner in the dashboard: six theme presets plus color overrides, live preview
- [x] One-step local environment with a demo shop and bookings (`npm run setup:local`, `npm run reset:local`)
- [x] Build once, migrate and deploy all clients with `npm run client:deploy -- --all`
- [x] CI (lint, typecheck, tests, build) and optional deploy on merge to main
- [x] Cron job that expires unapproved bookings

## Pilot
- [ ] Per-staff price and duration overrides (if a shop needs them)
- [ ] Fixes from real shop feedback
- [ ] Testing on cheap phones and slow connections
- [ ] Usage overview across clients for the founders

## Phase 2
- [ ] Official WhatsApp Business API: automatic confirmations and reminders
- [ ] Select several services in one booking (options cover most cases today)
- [ ] Waitlist that fills cancelled slots
- [ ] Rebooking nudges ("it's been 4 weeks")
- [ ] No-show tracking and repeat-offender flags
- [ ] Stats: busiest days, revenue estimate, no-show rate
- [ ] Push notifications for new bookings
- [ ] Installable PWA for the dashboard
- [ ] Gallery / portfolio section (for tattoo artists)

## Later
- [ ] AI chat booking through WhatsApp
- [ ] Online deposits via local wallets or bank apps
- [ ] Multiple branches per owner
- [ ] Subscription billing for shops
- [ ] Reviews
- [ ] Product orders and payment

## Non-functional
- [x] RTL layout on every screen
- [x] Mobile-first dashboard with a bottom tab bar on phones; tables that drop columns on small screens
- [x] Light, CSS-only motion (fade-ins, parallax cover, scroll-in sections), off with "reduce motion"
- [x] Small pages and in-browser image resizing for weak connections
- [x] Store only name and phone; delete a customer on request
- [x] Unit tests for availability, pricing, phones, passwords, translations
