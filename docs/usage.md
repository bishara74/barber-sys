# Usage guide

For shop owners and staff. For installing and deploying, see [setup.md](setup.md).

- [The two sides of the app](#the-two-sides-of-the-app)
- [First-time setup](#first-time-setup)
- [What customers see](#what-customers-see)
- [Daily work](#daily-work)
- [Calendar](#calendar)
- [Bookings](#bookings)
- [Time off](#time-off)
- [Services and options](#services-and-options)
- [Products](#products)
- [Page and links](#page-and-links)
- [Staff and working hours](#staff-and-working-hours)
- [Customers](#customers)
- [Settings](#settings)
- [Users and roles](#users-and-roles)
- [Language](#language)
- [Questions](#questions)

---

## The two sides of the app

| | Address | Who |
|---|---|---|
| **Public page** | `/` | Customers. Your link in bio: name, photos, social icons, link buttons, services and prices, products, opening hours, and the **Book an appointment** button. |
| **Booking** | `/book` | Customers pick a service, options, a person, a time, and enter their name and phone. No account needed. |
| **Dashboard** | `/admin` | You and your staff. Log in with email and password. |

Put the public page address in your Instagram/TikTok bio and on a QR code at the shop.
The **Today** screen of the dashboard shows the link with a **Copy link** button.

---

## First-time setup

Do these once, in this order:

1. **Page & links**: shop name, tagline, about text, address, Google Maps link, phone, **WhatsApp number**,
   logo and cover photo. Add social icons (Instagram, TikTok…) and link buttons.
2. **Services**: create your **service types** first (e.g. *Barbershop*, *Tattoo*), then the services under each
   type with price and duration. Add options where needed (see below).
3. **Staff**: add each person who takes appointments, set their **working hours**, and tick the services they do.
   Your own account can be linked to your staff profile under **Users**.
4. **Settings**: choose whether new online bookings are **confirmed instantly** or **wait for your approval**,
   and check the limits.
5. Open your public page and make a test booking. Then cancel it from the dashboard.

Texts can be filled in **English and Arabic**. If one language is empty, the other is shown.

---

## What customers see

1. **Public page** with your branding, links, services and prices, products and opening hours.
2. **Book an appointment**:
   1. Choose a service (grouped by type).
   2. Choose options, if the service has any. The price and duration update live.
   3. Choose a person, or **Anyone available** (only shown if more than one person does that service).
   4. Pick a day and a free time. Only times that fit the whole appointment are shown.
   5. Enter name, phone and an optional note, and confirm.
3. **Confirmation page** with:
   - **Send to the shop on WhatsApp**: opens WhatsApp with a ready message to your WhatsApp number,
     including the booking link. This is how you get notified of new bookings.
   - **Add to calendar** for their phone.
   - **Change time** and **Cancel booking**, available until the cancellation window (default 3 hours before).
   - A private link they can reopen any time.

If you use **approval mode**, the customer sees *"Waiting for the shop to confirm"*. The time is held for them
(nobody else can take it) until you approve or decline, or until the hold expires (default 12 hours).

---

## Daily work

Open **Today** (the first page after login):

- **Waiting for approval**: new online bookings in approval mode. Tap **Approve** or **Decline**.
- **Today's appointments**: everything booked today, in time order. Tap one to open it.
- **Next 7 days**: how many bookings are coming up.
- Quick buttons: **New booking**, **Walk-in**, **Block time**.

### A customer walks in

**Walk-in** → choose the service and person. The start time is *now*, the name defaults to "Walk-in" and the phone
is optional. This keeps the slot blocked so nobody books over it online.

### A customer calls

**New booking** → service, options, person, date and time, name and phone. Shop bookings are confirmed right away.
They may be outside working hours, but they can never overlap another booking.

### When the work is done

Open the booking and tap **Completed**, or **No-show** if they didn't come. This keeps each customer's visit
history accurate.

---

## Calendar

**Calendar** has three views:

- **Day**: one column per staff member. Best on a phone or tablet at the chair.
- **Week**: one column per day.
- **Month**: an overview; tap a day to open it.

Colors:

| Look | Meaning |
|---|---|
| Amber, dashed border | Pending: waiting for your approval (the time is held) |
| Green | Confirmed |
| Blue | Completed |
| Red | No-show |
| Striped grey | Time off / blocked |

Tap an empty hour to add a booking at that time. Tap a booking to open it.
Use the **All staff** filter next to the date to show one person only. The red line marks the current time.

---

## Bookings

Opening a booking shows the service and options, price, duration, person, time, where it came from (online, shop,
walk-in), the customer's note and phone.

Actions:

| Booking is | You can |
|---|---|
| Pending | **Approve** or **Decline** |
| Confirmed | **Completed**, **No-show**, **Cancel** |

- **Move booking**: pick another person and/or start time. The move is refused if it would overlap another booking.
- **Message on WhatsApp**: ready-made messages (confirmation, reminder, apology, cancellation) that open WhatsApp
  with the customer's number. Tap one, check the text, send.
- **Private note**: only the shop sees it (e.g. "prefers number 2 on the sides").

Bookings keep the price, duration and option names from the moment they were made. Changing a service's price later
doesn't change past bookings.

---

## Time off

**Time off** blocks time so customers can't book it:

- **Whole shop (closed)**: holidays, Eid, a closed day.
- **One person**: a day off, a doctor's appointment, a long lunch.

Choose who, from when, to when, and an optional reason. Existing bookings in that time are not cancelled.
Move or cancel them yourself.

For regular weekly breaks, use working hours instead (see [Staff and working hours](#staff-and-working-hours)).

---

## Services and options

### Service types

Groups shown to customers, e.g. *Barbershop*, *Tattoo*, *Hair styling*. Reorder them with the arrows. A type can
be hidden. It can only be deleted when it has no services.

### Services

| Field | Notes |
|---|---|
| Name and description | In English and Arabic |
| Price | Leave empty for **Price on request**. Tick **Show as "from" price** for prices that vary (e.g. tattoos). A price of 0 shows as **Free**. |
| Duration | Minutes the appointment takes |
| Buffer after | Minutes kept free after it, e.g. for cleaning |
| Bookable online | Off = shown on the page with "Call to book", but not in the booking flow |
| Show on the page | Off = hidden everywhere for customers (you can still add it from the dashboard) |
| Who does this service | Only these people can be booked for it |

**Archive** a service you no longer offer. Archived services disappear for customers but stay in the booking
history. Restore them from the bottom of the Services page. A service can only be **deleted** if it was never booked.

### Options

Options let one service cover variations instead of creating many services. Each service can have several
**option groups**:

| Example group | Customer can pick | Required |
|---|---|---|
| Add-ons: *Beard trim* (+₪20, +15 min), *Hair wash* (+₪10, +10 min) | Any number | No |
| Hair length: *Short* (+₪0), *Long* (+₪10, +15 min) | One | Yes |
| Style: *Black & grey*, *Color* (+₪50, +30 min) | One | Yes |

Each option can add **extra price** and **extra minutes**. Both can be 0. The customer sees the total update as they
choose, and the booking takes the full duration on the calendar.

---

## Products

Products appear on your public page with photos, price and description. Customers tap **Ask on WhatsApp** to ask or
order. There is no online checkout.

- **Add product** → name, description, price (empty = price on request), **In stock**, **Show on the page**.
- After saving, add **photos**. You can upload several at once; they are resized on your phone before uploading.
  Reorder them with the arrows; the first photo is the cover.

---

## Page and links

- **Shop info**: name, tagline, about text, address, Google Maps link, phone and **WhatsApp number**.
  Customers send booking confirmations to the WhatsApp number, so make sure it's right.
- **Logo** (round) and **Cover photo** (wide, at the top of the page).
- **Social icons**: pick a platform and enter a link, an @handle, a phone number or an email.
  Platforms: Instagram, TikTok, Facebook, Snapchat, WhatsApp, YouTube, X, Telegram, Threads, phone, email, maps, website.
- **Link buttons**: big buttons under the booking button (e.g. "See our latest cuts", "Price list", "Gift cards").

Everything can be reordered with the arrows and hidden without deleting.

### Design

Under **Design**, pick a **style** (Classic, Noir, Ocean, Rose, Forest or Ink; light or dark), and optionally your own
**main color** (buttons and highlights) and **accent color** (soft backgrounds). The preview shows the result before
you save. After **Save**, your public page and the dashboard use the new look right away.

---

## Staff and working hours

**Staff** lists everyone who can be booked. Open a person to change:

- **Name** and **photo** (shown when customers choose who they want).
- **Taking bookings**: turn off when someone leaves or is away for a long time. People with past bookings can't be
  deleted, only turned off.
- **Services** they do.
- **Working hours** for each weekday. Add **two shifts** on one day for a break, e.g. 09:00–13:00 and 14:00–20:00.
  Days without shifts are days off.

The public page's **Opening hours** combine everyone's working hours.

A new staff member gets every service and the same hours as the first colleague. Adjust as needed.

---

## Customers

Every phone number that books becomes a customer. **Customers** lets you search by name or phone and shows
completed visits and the last visit.

Open a customer to:

- see their **booking history**,
- edit their name, phone and **notes**,
- call or WhatsApp them,
- **Delete customer** (owners only): removes their name and phone from all bookings, for privacy requests.

---

## Settings

| Setting | Default | Meaning |
|---|---|---|
| New online bookings | Wait for my approval | **Confirm instantly**: bookings are confirmed right away. **Wait for my approval**: they stay pending until you approve. |
| Hold pending bookings for | 12 hours | A pending booking holds its time this long. If you don't approve it in time, it expires and the time opens again. |
| Customers can choose a staff member | On | Off = customers can't pick a person; whoever is free and least busy gets the booking. |
| Appointment length | Use each service's duration | **Fixed slot length**: every booking takes whole slots (e.g. 30 min), rounded up. |
| Fixed slot length | 30 min | Used only in fixed mode. |
| Start times every | 15 min | The grid of start times customers see (e.g. 09:00, 09:15…). |
| Minimum notice | 60 min | How soon before an appointment customers can still book it online. |
| Book up to | 30 days | How far ahead customers can book. |
| Customers can change or cancel until | 3 hours | Before this, the booking link allows changes. After it, they must contact you. |
| Max upcoming bookings per phone | 2 | Stops one number from filling your calendar. |
| Phone country code | 970 | Added to local numbers like 059… (use 972 for Israeli numbers). |
| Currency code | ILS | Shekel. Also JOD, USD, … |

---

## Users and roles

**Users** (owners only) lists everyone who can log in.

| Role | Can |
|---|---|
| **Owner** | Everything. |
| **Staff** | Today, calendar, bookings, time off and customers, but only **their own** bookings and time off. Needs a linked **staff profile**. |

To add a barber's login: **Users** → **Add user** → role **Staff**, choose their **staff profile**, set a password
(at least 8 characters). They can change it under **Account**.

You can't delete yourself or change your own role, so the shop always keeps an owner.

---

## Language

The switch at the bottom of the public page and in the dashboard menu toggles **العربية / English**.
The choice is remembered per device. Arabic shows right-to-left.

---

## Questions

**How do I get notified of new bookings?**
Customers tap *Send to the shop on WhatsApp* after booking. Pending bookings also wait on **Today**.

**Someone booked the wrong service.**
Cancel it and add a new booking from the dashboard, or ask them to rebook.

**The customer's time is free again but they still have their link.**
If a pending booking expires or you decline it, their link shows that and offers *Book again*.

**Can two people book the same time?**
No. Even if they press the button at the same second, only one gets the slot; the other is asked to pick another time.

**I set hours but customers see no times.**
Check that the service is *Bookable online*, the person is *Taking bookings* and does that service, and the day isn't
inside time off. Also check *Minimum notice* and *Book up to* in Settings.
