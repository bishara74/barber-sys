import Link from "next/link";
import { useLocale } from "next-intl";
import type { Booking } from "@/db/schema";
import { bookingServiceLabel } from "@/lib/booking-text";
import { formatDate, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./booking-status";

type BookingRowProps = {
  booking: Booking;
  timeZone: string;
  staffName?: string;
  showDate?: boolean;
  /** The effective status (pending bookings past their deadline show as expired). */
  status: Booking["status"];
  className?: string;
};

/** One booking in a list, linking to its details. */
export function BookingRow({ booking, timeZone, staffName, showDate, status, className }: BookingRowProps) {
  const locale = useLocale();
  const start = booking.startsAt.getTime();
  return (
    <Link
      href={`/admin/bookings/${booking.id}`}
      className={cn("group flex items-center gap-3 rounded-theme p-2.5 transition hover:bg-primary-tint", className)}
    >
      <div className="flex w-16 shrink-0 flex-col items-center rounded-theme bg-surface py-1.5 ring-1 ring-border" dir="ltr">
        <span className="text-sm font-bold tabular-nums">{formatTime(start, locale, timeZone)}</span>
        {showDate ? (
          <span className="text-[10px] whitespace-nowrap text-muted" dir="auto">
            {formatDate(start, locale, timeZone, "compact")}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium transition group-hover:text-primary">{booking.customerName}</p>
        <p className="truncate text-sm text-muted">
          {bookingServiceLabel(booking, locale)}
          {staffName ? ` · ${staffName}` : ""}
        </p>
      </div>
      <StatusBadge status={status} />
    </Link>
  );
}
