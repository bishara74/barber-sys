import "server-only";
import { and, eq, gt, inArray, isNull, lt, ne, or } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { getDb } from "@/db";
import { bookings, staff, timeOff, workingHours } from "@/db/schema";
import {
  computeSlots,
  type Shift,
  type Slot,
  type SlotPlan,
  type StaffAvailability,
} from "./availability";
import type { Settings } from "./config";
import { addDays, localDate, MINUTE, weekdayOf, zonedTime } from "./time";

type BookingStatusColumns = { status: AnySQLiteColumn; pendingExpiresAt: AnySQLiteColumn };

/** Bookings that occupy their time: confirmed, or pending and not yet expired. */
export function blockingBooking(now: number, table: BookingStatusColumns = bookings) {
  return or(
    eq(table.status, "confirmed"),
    and(eq(table.status, "pending"), gt(table.pendingExpiresAt, new Date(now))),
  );
}

type AvailabilityQuery = {
  date: string;
  timeZone: string;
  staffIds: number[];
  now: number;
  /** Ignore this booking, so it can be moved to an overlapping time. */
  excludeBookingId?: number;
};

/** Shifts and busy periods for the given staff on one local date. */
export async function loadAvailability(query: AvailabilityQuery): Promise<StaffAvailability[]> {
  const { date, timeZone, staffIds, now, excludeBookingId } = query;
  if (staffIds.length === 0) return [];

  const dayStart = new Date(zonedTime(date, 0, timeZone));
  const dayEnd = new Date(zonedTime(addDays(date, 1), 0, timeZone));
  const db = getDb();

  const [hours, busyBookings, blocks] = await db.batch([
    db
      .select()
      .from(workingHours)
      .where(and(inArray(workingHours.staffId, staffIds), eq(workingHours.weekday, weekdayOf(date)))),
    db
      .select({
        staffId: bookings.staffId,
        startsAt: bookings.startsAt,
        blockedUntil: bookings.blockedUntil,
      })
      .from(bookings)
      .where(
        and(
          inArray(bookings.staffId, staffIds),
          lt(bookings.startsAt, dayEnd),
          gt(bookings.blockedUntil, dayStart),
          blockingBooking(now),
          excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined,
        ),
      ),
    db
      .select()
      .from(timeOff)
      .where(
        and(
          or(isNull(timeOff.staffId), inArray(timeOff.staffId, staffIds)),
          lt(timeOff.startsAt, dayEnd),
          gt(timeOff.endsAt, dayStart),
        ),
      ),
  ]);

  return staffIds.map((staffId) => ({
    staffId,
    shifts: hours
      .filter((shift) => shift.staffId === staffId)
      .map(({ startMin, endMin }) => ({ startMin, endMin })),
    busy: [
      ...busyBookings
        .filter((booking) => booking.staffId === staffId)
        .map((booking) => ({ start: booking.startsAt.getTime(), end: booking.blockedUntil.getTime() })),
      ...blocks
        .filter((block) => block.staffId === null || block.staffId === staffId)
        .map((block) => ({ start: block.startsAt.getTime(), end: block.endsAt.getTime() })),
    ],
  }));
}

/** The dates customers may book: from today up to the booking horizon. */
export function bookingWindow(settings: Settings, timeZone: string, now: number) {
  const first = localDate(now, timeZone);
  return { first, last: addDays(first, settings.maxDaysAhead) };
}

function mergeShifts(shifts: Shift[]): Shift[] {
  const merged: Shift[] = [];
  for (const shift of [...shifts].sort((a, b) => a.startMin - b.startMin)) {
    const last = merged.at(-1);
    if (last && shift.startMin <= last.endMin) last.endMin = Math.max(last.endMin, shift.endMin);
    else merged.push({ ...shift });
  }
  return merged;
}

export async function getStaffHours(staffId: number) {
  return getDb().select().from(workingHours).where(eq(workingHours.staffId, staffId));
}

/** Shop opening hours per weekday (index 0 = Sunday): the combined shifts of all active staff. */
export async function getWeeklyHours(): Promise<Shift[][]> {
  const rows = await getDb()
    .select({ weekday: workingHours.weekday, startMin: workingHours.startMin, endMin: workingHours.endMin })
    .from(workingHours)
    .innerJoin(staff, eq(staff.id, workingHours.staffId))
    .where(eq(staff.isActive, true));
  return Array.from({ length: 7 }, (_, weekday) =>
    mergeShifts(rows.filter((row) => row.weekday === weekday)),
  );
}

/** Each date customers can book, and whether the shop is open that day at all. */
export async function getBookingDays(settings: Settings, timeZone: string, now: number) {
  const { first, last } = bookingWindow(settings, timeZone, now);
  const [weekly, closures] = await Promise.all([
    getWeeklyHours(),
    getDb()
      .select({ startsAt: timeOff.startsAt, endsAt: timeOff.endsAt })
      .from(timeOff)
      .where(
        and(
          isNull(timeOff.staffId),
          lt(timeOff.startsAt, new Date(zonedTime(addDays(last, 1), 0, timeZone))),
          gt(timeOff.endsAt, new Date(zonedTime(first, 0, timeZone))),
        ),
      ),
  ]);

  const days: { date: string; open: boolean }[] = [];
  for (let date = first; date <= last; date = addDays(date, 1)) {
    const start = zonedTime(date, 0, timeZone);
    const end = zonedTime(addDays(date, 1), 0, timeZone);
    const closed = closures.some((c) => c.startsAt.getTime() <= start && c.endsAt.getTime() >= end);
    days.push({ date, open: weekly[weekdayOf(date)].length > 0 && !closed });
  }
  return days;
}

type SlotQuery = AvailabilityQuery & { plan: SlotPlan; settings: Settings };

/** Free start times on a date for the given staff, honouring notice and the booking horizon. */
export async function findSlots(query: SlotQuery): Promise<Slot[]> {
  const { date, timeZone, now, settings, plan } = query;
  const window = bookingWindow(settings, timeZone, now);
  if (date < window.first || date > window.last) return [];

  const staff = await loadAvailability(query);
  return computeSlots({
    date,
    timeZone,
    ...plan,
    earliestStart: now + settings.minNoticeMin * MINUTE,
    staff,
  });
}
