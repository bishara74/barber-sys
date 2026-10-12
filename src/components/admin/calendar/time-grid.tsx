import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Booking, TimeOff } from "@/db/schema";
import { bookingServiceLabel } from "@/lib/booking-text";
import { effectiveStatus } from "@/lib/bookings";
import { layoutLanes } from "@/lib/lanes";
import { formatClock, formatTime, localDate, localMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "../booking-status";

const HOUR_PX = 64;

export type GridColumn = {
  key: string;
  label: string;
  /** Local date shown in this column. */
  date: string;
  /** Staff member for new bookings created from this column, if any. */
  staffId: number | null;
  bookings: Booking[];
  blocks: TimeOff[];
};

type TimeGridProps = {
  columns: GridColumn[];
  startHour: number;
  endHour: number;
  timeZone: string;
  now: number;
};

/** Minutes from local midnight on `date`, clamped to that day. */
function minutesOn(date: string, ms: number, timeZone: string, edge: "start" | "end"): number {
  const day = localDate(ms, timeZone);
  if (day < date) return 0;
  if (day > date) return 24 * 60;
  const minutes = localMinutes(ms, timeZone);
  return edge === "end" && minutes === 0 ? 24 * 60 : minutes;
}

/** Day or week view: hours down the side, one column per day or per staff member. */
export function TimeGrid({ columns, startHour, endHour, timeZone, now }: TimeGridProps) {
  const t = useTranslations("admin.calendar");
  const locale = useLocale();
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const top = (minutes: number) => ((minutes - startHour * 60) / 60) * HOUR_PX;
  const today = localDate(now, timeZone);
  const nowMinutes = localMinutes(now, timeZone);
  const nowVisible = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

  return (
    <div className="overflow-x-auto rounded-theme border border-border bg-card">
      <div className="flex min-w-fit">
        <div className="sticky start-0 z-10 w-14 shrink-0 border-e border-border bg-card">
          <div className="h-10 border-b border-border" />
          {hours.map((hour) => (
            <div key={hour} className="relative text-end text-[11px] text-muted" style={{ height: HOUR_PX }} dir="ltr">
              <span className="absolute -top-2 end-2">{formatClock(hour * 60)}</span>
            </div>
          ))}
        </div>

        {columns.map((column) => {
          const events = layoutLanes(
            column.bookings.map((booking) => ({
              booking,
              start: minutesOn(column.date, booking.startsAt.getTime(), timeZone, "start"),
              end: minutesOn(column.date, booking.endsAt.getTime(), timeZone, "end"),
            })),
          );
          return (
            <div key={column.key} className="min-w-36 flex-1 border-e border-border last:border-e-0">
              <div
                className={cn(
                  "sticky top-0 flex h-10 items-center justify-center border-b border-border px-2 text-sm font-medium",
                  column.date === today && columns.length > 1 && "text-primary",
                )}
              >
                <span className="truncate">{column.label}</span>
              </div>
              <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((hour) => (
                  <Link
                    key={hour}
                    href={`/admin/bookings/new?start=${column.date}T${formatClock(hour * 60)}${column.staffId ? `&staff=${column.staffId}` : ""}`}
                    aria-label={`${column.label} ${formatClock(hour * 60)}`}
                    className="absolute inset-x-0 border-b border-border/60 hover:bg-accent/60"
                    style={{ top: top(hour * 60), height: HOUR_PX }}
                  />
                ))}

                {column.blocks.map((block) => {
                  const start = Math.max(minutesOn(column.date, block.startsAt.getTime(), timeZone, "start"), startHour * 60);
                  const end = Math.min(minutesOn(column.date, block.endsAt.getTime(), timeZone, "end"), endHour * 60);
                  if (end <= start) return null;
                  return (
                    <Link
                      key={`block-${block.id}`}
                      href="/admin/time-off"
                      className="absolute inset-x-0 overflow-hidden bg-[repeating-linear-gradient(135deg,var(--accent),var(--accent)_6px,transparent_6px,transparent_12px)] px-2 py-1 text-xs text-muted"
                      style={{ top: top(start), height: top(end) - top(start) }}
                    >
                      {block.reason || t("blocked")}
                    </Link>
                  );
                })}

                {events.map(({ booking, start, end, lane, lanes }) => {
                  const status = effectiveStatus(booking, now);
                  return (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className={cn(
                        "absolute overflow-hidden rounded-md border px-1.5 py-1 text-xs leading-tight shadow-sm",
                        STATUS_STYLES[status],
                        status === "pending" && "border-dashed",
                      )}
                      style={{
                        top: top(start) + 1,
                        height: Math.max(top(end) - top(start) - 2, 18),
                        insetInlineStart: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                      }}
                    >
                      <span className="font-semibold" dir="ltr">
                        {formatTime(booking.startsAt.getTime(), locale, timeZone)}
                      </span>{" "}
                      <span className="font-medium">{booking.customerName}</span>
                      <span className="block truncate opacity-80">{bookingServiceLabel(booking, locale)}</span>
                    </Link>
                  );
                })}

                {column.date === today && nowVisible ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                    style={{ top: top(nowMinutes) }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
