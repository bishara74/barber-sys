import "server-only";
import { and, count, eq, gt, gte, inArray, isNull, lt, ne, notExists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { getDb } from "@/db";
import {
  bookings,
  customers,
  timeOff,
  type Booking,
  type BookingSource,
  type BookingStatus,
} from "@/db/schema";
import { slotPlan, type Slot } from "./availability";
import { findService } from "./catalog";
import type { Settings } from "./config";
import { randomToken } from "./crypto";
import { normalizePhone } from "./phone";
import { quoteBooking, type Quote } from "./quote";
import { blockingBooking, findSlots } from "./schedule";
import { addDays, HOUR, localDate, MINUTE, zonedTime } from "./time";

export type BookingError =
  | "serviceUnavailable"
  | "invalidOptions"
  | "invalidPhone"
  | "tooManyBookings"
  | "slotTaken"
  | "notChangeable";

type Result<T> = ({ ok: true } & T) | { ok: false; error: BookingError };

/** Status changes the shop can make, by current stored status. */
const TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
};

export function canChangeStatus(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** What the customer sees: a pending booking past its approval deadline counts as expired. */
export function effectiveStatus(
  booking: Pick<Booking, "status" | "pendingExpiresAt">,
  now: number,
): BookingStatus {
  if (booking.status === "pending" && booking.pendingExpiresAt && booking.pendingExpiresAt.getTime() <= now) {
    return "expired";
  }
  return booking.status;
}

/** Customers can cancel or reschedule active bookings until the cancellation window. */
export function customerCanChange(
  booking: Pick<Booking, "status" | "pendingExpiresAt" | "startsAt">,
  settings: Settings,
  now: number,
): boolean {
  const status = effectiveStatus(booking, now);
  const active = status === "pending" || status === "confirmed";
  return active && booking.startsAt.getTime() - now >= settings.cancelWindowHours * HOUR;
}

function initialStatus(settings: Settings, now: number) {
  return settings.bookingMode === "approval"
    ? { status: "pending" as const, pendingExpiresAt: new Date(now + settings.pendingExpiryHours * HOUR) }
    : { status: "confirmed" as const, pendingExpiresAt: null };
}

const otherBooking = alias(bookings, "other");

/** Another active booking for the staff member overlaps [start, end). */
function conflictingBooking(staffId: number, start: number, end: number, now: number, excludeId?: number) {
  return getDb()
    .select({ one: sql`1` })
    .from(otherBooking)
    .where(
      and(
        eq(otherBooking.staffId, staffId),
        lt(otherBooking.startsAt, new Date(end)),
        gt(otherBooking.blockedUntil, new Date(start)),
        blockingBooking(now, otherBooking),
        excludeId ? ne(otherBooking.id, excludeId) : undefined,
      ),
    );
}

/** Time off for the staff member (or the whole shop) overlaps [start, end). */
function conflictingTimeOff(staffId: number, start: number, end: number) {
  return getDb()
    .select({ one: sql`1` })
    .from(timeOff)
    .where(
      and(
        or(eq(timeOff.staffId, staffId), isNull(timeOff.staffId)),
        lt(timeOff.startsAt, new Date(end)),
        gt(timeOff.endsAt, new Date(start)),
      ),
    );
}

type NewBooking = {
  staffId: number;
  customerId: number | null;
  serviceId: number;
  serviceNameEn: string;
  serviceNameAr: string;
  quote: Quote;
  startsAt: number;
  occupiedMin: number;
  bufferMin: number;
  status: BookingStatus;
  pendingExpiresAt: Date | null;
  source: BookingSource;
  customerName: string;
  customerPhone: string;
  customerNote: string;
};

/**
 * Inserts the booking only if the time is still free. The check and the insert are one
 * statement, and D1 runs writes one at a time, so two customers can never get the same slot.
 */
async function insertIfFree(
  booking: NewBooking,
  now: number,
  respectTimeOff: boolean,
): Promise<{ id: number; token: string } | null> {
  const token = randomToken();
  const start = booking.startsAt;
  const end = start + booking.occupiedMin * MINUTE;
  const blockedUntil = end + booking.bufferMin * MINUTE;
  const { quote } = booking;

  const result = await getDb().run(sql`
    INSERT INTO bookings (
      token, staff_id, customer_id, service_id, service_name_en, service_name_ar, options,
      price, price_is_from, duration_min, starts_at, ends_at, blocked_until, status, source,
      customer_name, customer_phone, customer_note, pending_expires_at, created_at, updated_at
    )
    SELECT
      ${token}, ${booking.staffId}, ${booking.customerId}, ${booking.serviceId},
      ${booking.serviceNameEn}, ${booking.serviceNameAr}, ${JSON.stringify(quote.options)},
      ${quote.price}, ${quote.priceIsFrom ? 1 : 0}, ${quote.durationMin}, ${start}, ${end},
      ${blockedUntil}, ${booking.status}, ${booking.source}, ${booking.customerName},
      ${booking.customerPhone}, ${booking.customerNote},
      ${booking.pendingExpiresAt?.getTime() ?? null}, ${now}, ${now}
    WHERE NOT EXISTS ${conflictingBooking(booking.staffId, start, blockedUntil, now)}
    ${respectTimeOff ? sql`AND NOT EXISTS ${conflictingTimeOff(booking.staffId, start, blockedUntil)}` : sql``}
  `);

  return result.meta.changes > 0 ? { id: Number(result.meta.last_row_id), token } : null;
}

type Move = {
  staffId: number;
  startsAt: number;
  status: BookingStatus;
  pendingExpiresAt: Date | null;
  respectTimeOff: boolean;
};

/** Moves a booking (and/or changes its status) only if the new time is free. Atomic like insertIfFree. */
async function moveIfFree(booking: Booking, move: Move, now: number): Promise<boolean> {
  const occupied = booking.endsAt.getTime() - booking.startsAt.getTime();
  const buffer = booking.blockedUntil.getTime() - booking.endsAt.getTime();
  const start = move.startsAt;
  const end = start + occupied;
  const blockedUntil = end + buffer;

  const updated = await getDb()
    .update(bookings)
    .set({
      staffId: move.staffId,
      startsAt: new Date(start),
      endsAt: new Date(end),
      blockedUntil: new Date(blockedUntil),
      status: move.status,
      pendingExpiresAt: move.pendingExpiresAt,
      updatedAt: new Date(now),
    })
    .where(
      and(
        eq(bookings.id, booking.id),
        notExists(conflictingBooking(move.staffId, start, blockedUntil, now, booking.id)),
        move.respectTimeOff ? notExists(conflictingTimeOff(move.staffId, start, blockedUntil)) : undefined,
      ),
    )
    .returning({ id: bookings.id });

  return updated.length > 0;
}

export async function upsertCustomer(name: string, phone: string): Promise<number> {
  const [row] = await getDb()
    .insert(customers)
    .values({ name, phone })
    .onConflictDoUpdate({ target: customers.phone, set: { name } })
    .returning({ id: customers.id });
  return row.id;
}

async function activeBookingsForPhone(phone: string, now: number): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.customerPhone, phone),
        gte(bookings.startsAt, new Date(now)),
        blockingBooking(now),
      ),
    );
  return row?.total ?? 0;
}

/** Staff ordered by how many active bookings they have that day, least busy first. */
async function leastBusyFirst(staffIds: number[], date: string, timeZone: string, now: number) {
  if (staffIds.length < 2) return staffIds;
  const rows = await getDb()
    .select({ staffId: bookings.staffId, total: count() })
    .from(bookings)
    .where(
      and(
        inArray(bookings.staffId, staffIds),
        gte(bookings.startsAt, new Date(zonedTime(date, 0, timeZone))),
        lt(bookings.startsAt, new Date(zonedTime(addDays(date, 1), 0, timeZone))),
        blockingBooking(now),
      ),
    )
    .groupBy(bookings.staffId);
  const load = new Map(rows.map((row) => [row.staffId, row.total]));
  return [...staffIds].sort((a, b) => (load.get(a) ?? 0) - (load.get(b) ?? 0));
}

type OnlineRequest = {
  serviceId: number;
  optionIds: number[];
  /** Null lets the shop pick whoever is free. */
  staffId: number | null;
};

/** Checks what a customer asks for online and works out its price, length and eligible staff. */
async function resolveOnlineRequest(request: OnlineRequest, settings: Settings) {
  const service = await findService(request.serviceId);
  if (!service || !service.isVisible || !service.bookableOnline || service.staffIds.length === 0) {
    return { ok: false as const, error: "serviceUnavailable" as const };
  }

  const quoted = quoteBooking(service, service.groups, request.optionIds);
  if (!quoted.ok) return { ok: false as const, error: "invalidOptions" as const };

  const chosenStaff = settings.allowStaffChoice ? request.staffId : null;
  if (chosenStaff !== null && !service.staffIds.includes(chosenStaff)) {
    return { ok: false as const, error: "serviceUnavailable" as const };
  }

  return {
    ok: true as const,
    service,
    quote: quoted.quote,
    plan: slotPlan(settings, quoted.quote.durationMin, quoted.quote.bufferMin),
    staffIds: chosenStaff === null ? service.staffIds : [chosenStaff],
  };
}

/** Free start times for a new online booking on a date. */
export async function slotsForNewBooking(
  request: OnlineRequest & { date: string },
  settings: Settings,
  timeZone: string,
): Promise<Slot[]> {
  const resolved = await resolveOnlineRequest(request, settings);
  if (!resolved.ok) return [];
  const { plan, staffIds } = resolved;
  return findSlots({ date: request.date, timeZone, now: Date.now(), settings, plan, staffIds });
}

/** Free start times to move an existing booking to, with the same staff member. */
export async function slotsForReschedule(
  booking: Booking,
  date: string,
  settings: Settings,
  timeZone: string,
): Promise<Slot[]> {
  const now = Date.now();
  if (!customerCanChange(booking, settings, now)) return [];

  const occupiedMin = (booking.endsAt.getTime() - booking.startsAt.getTime()) / MINUTE;
  const bufferMin = (booking.blockedUntil.getTime() - booking.endsAt.getTime()) / MINUTE;
  const { stepMin } = slotPlan(settings, occupiedMin, bufferMin);
  return findSlots({
    date,
    timeZone,
    now,
    settings,
    plan: { occupiedMin, bufferMin, stepMin },
    staffIds: [booking.staffId],
    excludeBookingId: booking.id,
  });
}

type OnlineBookingInput = OnlineRequest & {
  startsAt: number;
  name: string;
  phone: string;
  note: string;
};

/** A booking made by a customer on the public booking page. */
export async function placeOnlineBooking(
  input: OnlineBookingInput,
  settings: Settings,
  timeZone: string,
): Promise<Result<{ token: string }>> {
  const now = Date.now();
  const resolved = await resolveOnlineRequest(input, settings);
  if (!resolved.ok) return resolved;
  const { service, quote, plan, staffIds } = resolved;

  const phone = normalizePhone(input.phone, settings.phoneCountryCode);
  if (!phone) return { ok: false, error: "invalidPhone" };
  if ((await activeBookingsForPhone(phone, now)) >= settings.maxActiveBookingsPerPhone) {
    return { ok: false, error: "tooManyBookings" };
  }

  const date = localDate(input.startsAt, timeZone);
  const slots = await findSlots({ date, timeZone, now, settings, plan, staffIds });
  const slot = slots.find((candidate) => candidate.start === input.startsAt);
  if (!slot) return { ok: false, error: "slotTaken" };

  const customerId = await upsertCustomer(input.name, phone);
  const staffOrder = await leastBusyFirst(slot.staffIds, date, timeZone, now);

  for (const staffId of staffOrder) {
    const created = await insertIfFree(
      {
        staffId,
        customerId,
        serviceId: service.id,
        serviceNameEn: service.nameEn,
        serviceNameAr: service.nameAr,
        quote,
        startsAt: input.startsAt,
        occupiedMin: plan.occupiedMin,
        bufferMin: plan.bufferMin,
        ...initialStatus(settings, now),
        source: "online",
        customerName: input.name,
        customerPhone: phone,
        customerNote: input.note,
      },
      now,
      true,
    );
    if (created) return { ok: true, token: created.token };
  }
  return { ok: false, error: "slotTaken" };
}

type ShopBookingInput = {
  serviceId: number;
  optionIds: number[];
  staffId: number;
  startsAt: number;
  name: string;
  phone: string;
  note: string;
  source: "admin" | "walk_in";
};

/**
 * A booking added from the dashboard (phone booking or walk-in). It may be outside working
 * hours or during blocked time, but it can never overlap another booking.
 */
export async function placeShopBooking(
  input: ShopBookingInput,
  settings: Settings,
): Promise<Result<{ id: number }>> {
  const now = Date.now();
  const service = await findService(input.serviceId);
  if (!service) return { ok: false, error: "serviceUnavailable" };

  const quoted = quoteBooking(service, service.groups, input.optionIds);
  if (!quoted.ok) return { ok: false, error: "invalidOptions" };

  let phone = "";
  if (input.phone.trim()) {
    const normalized = normalizePhone(input.phone, settings.phoneCountryCode);
    if (!normalized) return { ok: false, error: "invalidPhone" };
    phone = normalized;
  }
  const customerId = phone ? await upsertCustomer(input.name, phone) : null;
  const plan = slotPlan(settings, quoted.quote.durationMin, quoted.quote.bufferMin);

  const created = await insertIfFree(
    {
      staffId: input.staffId,
      customerId,
      serviceId: service.id,
      serviceNameEn: service.nameEn,
      serviceNameAr: service.nameAr,
      quote: quoted.quote,
      startsAt: input.startsAt,
      occupiedMin: plan.occupiedMin,
      bufferMin: plan.bufferMin,
      status: "confirmed",
      pendingExpiresAt: null,
      source: input.source,
      customerName: input.name,
      customerPhone: phone,
      customerNote: input.note,
    },
    now,
    false,
  );
  return created ? { ok: true, id: created.id } : { ok: false, error: "slotTaken" };
}

export async function findBookingByToken(token: string): Promise<Booking | undefined> {
  return getDb().query.bookings.findFirst({ where: eq(bookings.token, token) });
}

export async function findBooking(id: number): Promise<Booking | undefined> {
  return getDb().query.bookings.findFirst({ where: eq(bookings.id, id) });
}

/** Customer moves their own booking to another free time with the same staff member. */
export async function rescheduleByCustomer(
  booking: Booking,
  startsAt: number,
  settings: Settings,
  timeZone: string,
): Promise<Result<object>> {
  const now = Date.now();
  if (!customerCanChange(booking, settings, now)) return { ok: false, error: "notChangeable" };

  const slots = await slotsForReschedule(booking, localDate(startsAt, timeZone), settings, timeZone);
  if (!slots.some((slot) => slot.start === startsAt)) return { ok: false, error: "slotTaken" };

  const moved = await moveIfFree(
    booking,
    { staffId: booking.staffId, startsAt, respectTimeOff: true, ...initialStatus(settings, now) },
    now,
  );
  return moved ? { ok: true } : { ok: false, error: "slotTaken" };
}

/** Shop moves a booking to any time or staff member, as long as it does not overlap another booking. */
export async function rescheduleByShop(
  booking: Booking,
  staffId: number,
  startsAt: number,
): Promise<Result<object>> {
  const now = Date.now();
  const status = effectiveStatus(booking, now);
  if (status !== "pending" && status !== "confirmed") return { ok: false, error: "notChangeable" };
  const stillPending = status === "pending";
  const moved = await moveIfFree(
    booking,
    {
      staffId,
      startsAt,
      status: stillPending ? "pending" : "confirmed",
      pendingExpiresAt: stillPending ? booking.pendingExpiresAt : null,
      respectTimeOff: false,
    },
    now,
  );
  return moved ? { ok: true } : { ok: false, error: "slotTaken" };
}

/** Confirms a pending booking. Fails if its time was given away after it expired. */
export async function approveBooking(booking: Booking): Promise<Result<object>> {
  const moved = await moveIfFree(
    booking,
    {
      staffId: booking.staffId,
      startsAt: booking.startsAt.getTime(),
      status: "confirmed",
      pendingExpiresAt: null,
      respectTimeOff: false,
    },
    Date.now(),
  );
  return moved ? { ok: true } : { ok: false, error: "slotTaken" };
}

/** Status changes that free the slot or close the booking: decline, cancel, complete, no-show. */
export async function setBookingStatus(
  id: number,
  status: Extract<BookingStatus, "declined" | "cancelled" | "completed" | "no_show">,
) {
  await getDb()
    .update(bookings)
    .set({ status, pendingExpiresAt: null, updatedAt: new Date() })
    .where(eq(bookings.id, id));
}

