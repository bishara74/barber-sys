import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Booking } from "@/db/schema";
import { effectiveStatus } from "@/lib/bookings";
import { addDays, addMonths, formatDay, formatTime, localDate, startOfWeek } from "@/lib/time";
import { cn } from "@/lib/utils";
import { STATUS_DOT } from "../booking-status";

const MAX_PER_DAY = 3;

type MonthGridProps = {
  /** First day of the month. */
  month: string;
  bookings: Booking[];
  timeZone: string;
  now: number;
  /** Extra search params kept when opening a day (e.g. the staff filter). */
  linkParams: string;
};

export function MonthGrid({ month, bookings, timeZone, now, linkParams }: MonthGridProps) {
  const t = useTranslations("admin.calendar");
  const locale = useLocale();
  // Whole weeks covering the month.
  const end = addMonths(month, 1);
  const days: string[] = [];
  for (let day = startOfWeek(month); day < end || days.length % 7 !== 0; day = addDays(day, 1)) {
    days.push(day);
  }
  const today = localDate(now, timeZone);

  const byDay = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const day = localDate(booking.startsAt.getTime(), timeZone);
    byDay.set(day, [...(byDay.get(day) ?? []), booking]);
  }

  return (
    <div className="overflow-hidden rounded-theme border border-border bg-card shadow-soft">
      <div className="grid grid-cols-7 border-b border-border bg-surface text-center text-xs font-medium text-muted">
        {days.slice(0, 7).map((day) => (
          <div key={day} className="py-2.5">
            {formatDay(day, locale, { weekday: "short" })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const items = byDay.get(day) ?? [];
          const outside = day.slice(0, 7) !== month.slice(0, 7);
          return (
            <Link
              key={day}
              href={`/admin/calendar?view=day&date=${day}${linkParams}`}
              className={cn(
                "group min-h-24 border-b border-e border-border p-1.5 transition-colors hover:bg-primary-tint sm:min-h-28 [&:nth-child(7n)]:border-e-0",
                outside && "bg-surface/50 text-muted",
              )}
            >
              <span className="flex">
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-xs font-medium tabular-nums transition",
                    day === today ? "bg-primary font-bold text-primary-foreground shadow-glow" : "group-hover:bg-card",
                    outside && "opacity-60",
                  )}
                >
                  {Number(day.slice(8))}
                </span>
              </span>
              <ul className="mt-1 hidden space-y-0.5 sm:block">
                {items.slice(0, MAX_PER_DAY).map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center gap-1 truncate rounded-md bg-surface px-1 py-0.5 text-[11px] ring-1 ring-border/60"
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[effectiveStatus(booking, now)])} aria-hidden />
                    <span className="font-medium tabular-nums" dir="ltr">
                      {formatTime(booking.startsAt.getTime(), locale, timeZone)}
                    </span>
                    <span className="truncate">{booking.customerName}</span>
                  </li>
                ))}
                {items.length > MAX_PER_DAY ? (
                  <li className="px-1 text-[11px] font-medium text-primary">{t("more", { count: items.length - MAX_PER_DAY })}</li>
                ) : null}
              </ul>
              {/* Phones: one dot per booking instead of the list. */}
              <span className="mt-1.5 flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
                {items.slice(0, 6).map((booking) => (
                  <span key={booking.id} className={cn("size-1.5 rounded-full", STATUS_DOT[effectiveStatus(booking, now)])} />
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
