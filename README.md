# barber-sys

A booking and appointment web app for small barbershops in Bethlehem and the West Bank. Customers book from their phone in Arabic or English, with no account. Barbers manage everything from a simple dashboard. Bookings are confirmed over WhatsApp.

## Goals

- Mobile-first, fast on weak connections
- Arabic (RTL) and English from day one
- Simple enough that a barber actually uses it all day
- Configurable per shop, with sensible defaults
- Built for many shops, launched with one first

## Status

Planning. See [`docs/decisions.md`](docs/decisions.md) and [`docs/features.md`](docs/features.md).

## Planned stack

- Next.js + Tailwind CSS (RTL support)
- Supabase (Postgres + auth)
- Vercel for hosting

## Repo layout

```
app/        Next.js application
docs/       Decisions, features, data model
supabase/   Database migrations
```

## Working agreement

- Work in branches, open pull requests, review each other's PRs
- Every feature is a GitHub Issue, grouped into milestones: MVP, Pilot, Phase 2
- Settings have defaults first; UI for a setting is built only when a shop needs it
