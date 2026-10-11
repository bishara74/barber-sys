# Features

Milestones: **MVP** (first shop), **Pilot** (polish with 2-3 shops), **Phase 2**, **Later**.

## MVP

### Customer booking
- [ ] Public booking page per shop (`/shop-name`), mobile-first
- [ ] Arabic (RTL) and English with a language switch
- [ ] Choose service, then barber (skipped if single barber), then date and time
- [ ] Services grouped by category, showing price and duration
- [ ] Name and phone only, no account
- [ ] Confirmation screen with "Confirm on WhatsApp" button (pre-filled `wa.me` message)
- [ ] Cancel or reschedule through a private link
- [ ] Limit on bookings per phone number

### Services (barber-configurable)
- [ ] Name in Arabic and English
- [ ] Price (₪), with an optional "starting from" flag
- [ ] Duration in minutes (5-minute steps)
- [ ] Category / type (haircut, beard, kids, combo)
- [ ] Optional description and buffer time after the service
- [ ] Active / hidden toggle
- [ ] "Bookable online" toggle (some services are walk-in or call only)
- [ ] Display order
- [ ] Combos created as their own service
- [ ] Archive instead of delete when a service has past bookings
- [ ] Bookings store a snapshot of service name, price and duration

### Availability engine (build first)
- [ ] Working hours per barber
- [ ] Breaks, days off, holidays
- [ ] Per-service duration or fixed slot length (configurable)
- [ ] Time grid (15 / 30 min) and buffer between appointments
- [ ] No double-booking, including under concurrent requests
- [ ] Minimum notice and maximum days ahead

### Barber dashboard
- [ ] Login for owner and barbers
- [ ] Working hours, breaks, days off
- [ ] Day and week calendar view
- [ ] Approve / decline bookings (when approval mode is on)
- [ ] Cancel, reschedule, mark completed or no-show
- [ ] Add a walk-in manually and block time
- [ ] Client list with phone and visit history
- [ ] Each new booking is pushed to the barber's WhatsApp (via link for MVP)

### Per-shop settings (defaults first, UI as needed)
- [ ] Booking mode: instant or barber approval
- [ ] Slot logic: fixed length or per-service duration
- [ ] Time grid and buffer
- [ ] Multi-barber on / off
- [ ] Minimum notice, booking horizon, cancellation window
- [ ] Max bookings per phone
- [ ] Enabled languages
- [ ] Shop info: name, address, map link, phone, logo, Instagram

### Super admin portal (founders only)
- [ ] Create and manage shops and owner accounts
- [ ] Enable or disable features per shop
- [ ] Basic usage overview (bookings per shop)

## Pilot
- [ ] Per-barber price and duration overrides (if not needed in MVP)
- [ ] Fixes from real shop feedback
- [ ] Testing on cheap phones and slow connections

## Phase 2
- [ ] Official WhatsApp Business API: automatic confirmations and reminders
- [ ] Select several services in one booking (durations and prices add up)
- [ ] Waitlist that fills cancelled slots
- [ ] Rebooking nudges ("it's been 4 weeks")
- [ ] No-show tracking and repeat-offender flags
- [ ] Stats: busiest days, revenue estimate, no-show rate
- [ ] Barber notifications (WhatsApp or push)
- [ ] Installable PWA for the barber dashboard
- [ ] Customer notes (e.g. preferred cut)

## Later
- [ ] AI chat booking through WhatsApp
- [ ] Online deposits via local wallets or bank apps
- [ ] Multiple branches per owner
- [ ] Subscription billing for shops
- [ ] Reviews and shop gallery
- [ ] Custom domain or branding per shop

## Non-functional
- [ ] RTL layout correct on every screen
- [ ] Fast on cheap phones and weak connections
- [ ] Bookings stored safely even if the shop is offline
- [ ] GDPR-style basics: store only name and phone, allow deletion on request
