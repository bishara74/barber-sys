import Link from "next/link";
import { useLocale } from "next-intl";
import type { Booking } from "@/db/schema";
import { bookingServiceLabel } from "@/lib/booking-text";
import { formatDate, formatTime } from "@/lib/time";
import { StatusBadge } from "./booking-status";

type BookingRowProps = {
  booking: Booking;
  timeZone: string;
  staffName?: string;
  showDate?: boolean;
  /** The effective status (pending bookings past their deadline show as expired). */
  status: Booking["status"];
};

/** One booking in a list, linking to its details. */
export function BookingRow({ booking, timeZone, staffName, showDate, status }: BookingRowProps) {
  const locale = useLocale();
  const start = booking.startsAt.getTime();
  return (
    <Link
      href={`/admin/bookings/${booking.id}`}
      className="flex items-center gap-3 rounded-theme px-2 py-2.5 hover:bg-accent"
    >
      <div className="w-14 shrink-0 text-center" dir="ltr">
        <p className="font-semibold">{formatTime(start, locale, timeZone)}</p>
        {showDate ? <p className="text-[11px] text-muted">{formatDate(start, locale, timeZone, "short")}</p> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{booking.customerName}</p>
        <p className="truncate text-sm text-muted">
          {bookingServiceLabel(booking, locale)}
          {staffName ? ` · ${staffName}` : ""}
        </p>
      </div>
      <StatusBadge status={status} />
    </Link>
  );
}
