import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Booking, TimeOff } from "@/db/schema";
import { bookingServiceLabel } from "@/lib/booking-text";
import { effectiveStatus } from "@/lib/bookings";
import { layoutLanes } from "@/lib/lanes";
import { formatClock, formatTime, localDate, localMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_STYLES } from "../booking-status";
import { ScrollToToday } from "./scroll-to-today";

const HOUR_PX = 72;

export type GridColumn = {
  key: string;
  label: string;
  /** Small line above the label, e.g. the weekday. */
  overline?: string;
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
    <div data-scroller className="scrollbar-thin overflow-x-auto rounded-theme border border-border bg-card shadow-soft">
      <ScrollToToday />
      <div className="flex min-w-fit">
        <div className="sticky start-0 z-20 w-14 shrink-0 border-e border-border bg-card">
          <div className="h-14 border-b border-border" />
          {hours.map((hour) => (
            <div key={hour} className="relative text-end text-[11px] text-muted tabular-nums" style={{ height: HOUR_PX }} dir="ltr">
              <span className="absolute -top-2 end-2">{formatClock(hour * 60)}</span>
            </div>
          ))}
        </div>

        {columns.map((column) => {
          const isToday = column.date === today && columns.length > 1;
          const events = layoutLanes(
            column.bookings.map((booking) => ({
              booking,
              start: minutesOn(column.date, booking.startsAt.getTime(), timeZone, "start"),
              end: minutesOn(column.date, booking.endsAt.getTime(), timeZone, "end"),
            })),
          );
          return (
            <div
              key={column.key}
              data-today={isToday || undefined}
              className={cn("min-w-36 flex-1 border-e border-border last:border-e-0", isToday && "bg-primary-tint/60")}
            >
              <div className="sticky top-0 z-10 flex h-14 flex-col items-center justify-center border-b border-border bg-card/95 px-2 backdrop-blur">
                {column.overline ? <span className="text-[11px] text-muted">{column.overline}</span> : null}
                <span
                  className={cn(
                    "max-w-full truncate text-sm font-semibold",
                    isToday && "rounded-full bg-primary px-2.5 text-primary-foreground",
                  )}
                >
                  {column.label}
                </span>
              </div>
              <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((hour) => (
                  <Link
                    key={hour}
                    href={`/admin/bookings/new?start=${column.date}T${formatClock(hour * 60)}${column.staffId ? `&staff=${column.staffId}` : ""}`}
                    aria-label={`${column.label} ${formatClock(hour * 60)}`}
                    className="group/slot absolute inset-x-0 border-b border-border/70 transition-colors hover:bg-primary-tint"
                    style={{ top: top(hour * 60), height: HOUR_PX }}
                  >
                    <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/50" aria-hidden />
                    <span
                      className="absolute start-2 top-1.5 text-lg leading-none text-primary opacity-0 transition group-hover/slot:opacity-100"
                      aria-hidden
                    >
                      +
                    </span>
                  </Link>
                ))}

                {column.blocks.map((block) => {
                  const start = Math.max(minutesOn(column.date, block.startsAt.getTime(), timeZone, "start"), startHour * 60);
                  const end = Math.min(minutesOn(column.date, block.endsAt.getTime(), timeZone, "end"), endHour * 60);
                  if (end <= start) return null;
                  return (
                    <Link
                      key={`block-${block.id}`}
                      href="/admin/time-off"
                      className="absolute inset-x-0 overflow-hidden border-y border-border bg-[repeating-linear-gradient(135deg,var(--accent),var(--accent)_6px,transparent_6px,transparent_12px)] px-2 py-1 text-xs font-medium text-muted"
                      style={{ top: top(start), height: top(end) - top(start) }}
                    >
                      {block.reason || t("blocked")}
                    </Link>
                  );
                })}

                {events.map(({ booking, start, end, lane, lanes }) => {
                  const status = effectiveStatus(booking, now);
                  const height = Math.max(top(end) - top(start) - 3, 22);
                  return (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className={cn(
                        "absolute z-[1] overflow-hidden rounded-lg border border-s-[3px] px-2 py-1 text-xs leading-tight shadow-xs transition hover:z-10 hover:shadow-lift",
                        STATUS_STYLES[status],
                        status === "pending" && "border-dashed",
                      )}
                      style={{
                        top: top(start) + 1.5,
                        height,
                        insetInlineStart: `calc(${(lane / lanes) * 100}% + 3px)`,
                        width: `calc(${100 / lanes}% - 6px)`,
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <span className="font-semibold tabular-nums" dir="ltr">
                          {formatTime(booking.startsAt.getTime(), locale, timeZone)}
                        </span>
                        <span className="truncate font-medium">{booking.customerName}</span>
                      </span>
                      {height > 34 ? (
                        <span className="mt-0.5 block truncate opacity-80">{bookingServiceLabel(booking, locale)}</span>
                      ) : null}
                    </Link>
                  );
                })}

                {column.date === today && nowVisible ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                    style={{ top: top(nowMinutes) }}
                  >
                    <span className="absolute -start-1 -top-[5px] size-2 rounded-full bg-red-500" />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Explains the calendar colors. */
export function CalendarLegend() {
  const t = useTranslations("status");
  const tc = useTranslations("admin.calendar");
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {(["pending", "confirmed", "completed", "no_show"] as const).map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", STATUS_DOT[status])} aria-hidden />
          {t(status)}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-sm bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_2px,transparent_2px,transparent_4px)]"
          aria-hidden
        />
        {tc("blocked")}
      </li>
    </ul>
  );
}
