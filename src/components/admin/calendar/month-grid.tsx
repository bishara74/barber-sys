import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Booking } from "@/db/schema";
import { effectiveStatus } from "@/lib/bookings";
import { addDays, addMonths, formatDay, formatTime, localDate, startOfWeek } from "@/lib/time";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "../booking-status";

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
    <div className="overflow-hidden rounded-theme border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border text-center text-xs text-muted">
        {days.slice(0, 7).map((day) => (
          <div key={day} className="py-2">
            {formatDay(day, locale, { weekday: "short" })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const items = byDay.get(day) ?? [];
          return (
            <Link
              key={day}
              href={`/admin/calendar?view=day&date=${day}${linkParams}`}
              className={cn(
                "min-h-24 border-b border-e border-border p-1.5 hover:bg-accent [&:nth-child(7n)]:border-e-0",
                day.slice(0, 7) !== month.slice(0, 7) && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs",
                  day === today && "bg-primary text-primary-foreground",
                )}
              >
                {Number(day.slice(8))}
              </span>
              <ul className="mt-1 space-y-0.5">
                {items.slice(0, MAX_PER_DAY).map((booking) => (
                  <li
                    key={booking.id}
                    className={cn("truncate rounded px-1 text-[11px]", STATUS_STYLES[effectiveStatus(booking, now)])}
                  >
                    <span dir="ltr">{formatTime(booking.startsAt.getTime(), locale, timeZone)}</span> {booking.customerName}
                  </li>
                ))}
                {items.length > MAX_PER_DAY ? (
                  <li className="px-1 text-[11px] text-muted">{t("more", { count: items.length - MAX_PER_DAY })}</li>
                ) : null}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
