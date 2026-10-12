import "server-only";
import { and, asc, eq, gt, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, timeOff, type BookingStatus } from "@/db/schema";
import type { SessionUser } from "./auth";

/** Statuses shown on the calendar. Cancelled, declined and expired bookings free their time. */
export const CALENDAR_STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "no_show"];

/** Staff accounts only see their own bookings; owners can filter by staff member. */
export function visibleStaffId(user: SessionUser, requested: number | null): number | null {
  return user.role === "owner" ? requested : (user.staffId ?? -1);
}

type RangeQuery = { from: number; to: number; staffId: number | null; statuses?: BookingStatus[] };

export async function getBookingsInRange({ from, to, staffId, statuses = CALENDAR_STATUSES }: RangeQuery) {
  return getDb()
    .select()
    .from(bookings)
    .where(
      and(
        lt(bookings.startsAt, new Date(to)),
        gt(bookings.endsAt, new Date(from)),
        inArray(bookings.status, statuses),
        staffId === null ? undefined : eq(bookings.staffId, staffId),
      ),
    )
    .orderBy(asc(bookings.startsAt));
}

export async function getTimeOffInRange({ from, to, staffId }: Omit<RangeQuery, "statuses">) {
  return getDb()
    .select()
    .from(timeOff)
    .where(
      and(
        lt(timeOff.startsAt, new Date(to)),
        gt(timeOff.endsAt, new Date(from)),
        staffId === null ? undefined : or(isNull(timeOff.staffId), eq(timeOff.staffId, staffId)),
      ),
    )
    .orderBy(asc(timeOff.startsAt));
}

/** Upcoming bookings still waiting for approval (and not yet expired). */
export async function getPendingBookings(now: number, staffId: number | null) {
  return getDb()
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "pending"),
        gt(bookings.pendingExpiresAt, new Date(now)),
        gte(bookings.startsAt, new Date(now)),
        staffId === null ? undefined : eq(bookings.staffId, staffId),
      ),
    )
    .orderBy(asc(bookings.startsAt));
}
