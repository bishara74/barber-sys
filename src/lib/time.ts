import { TZDate } from "@date-fns/tz";
import { intlLocale, type Locale } from "@/i18n/locales";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let instance = formatters.get(key);
  if (!instance) {
    instance = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, instance);
  }
  return instance;
}

/** True for a real calendar date written as "YYYY-MM-DD". */
export function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** The instant for a local date and minutes-from-midnight in a time zone. DST safe. */
export function zonedTime(date: string, minutes: number, timeZone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new TZDate(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, timeZone).getTime();
}

/** Local calendar date ("YYYY-MM-DD") of an instant in a time zone. */
export function localDate(ms: number, timeZone: string): string {
  return formatter("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    ms,
  );
}

/** Minutes since local midnight of an instant in a time zone. */
export function localMinutes(ms: number, timeZone: string): number {
  const parts = formatter("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ms);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** 0 = Sunday ... 6 = Saturday */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Sunday of the week containing the date (the local work week starts on Sunday). */
export function startOfWeek(date: string): string {
  return addDays(date, -weekdayOf(date));
}

export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function addMonths(date: string, months: number): string {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, 1)).toISOString().slice(0, 10);
}

/** "09:30" -> 570. Returns null for invalid input. Accepts "24:00" as end of day. */
export function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) return null;
  return hours * 60 + minutes;
}

/** 570 -> "09:30" */
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTime(ms: number, locale: Locale, timeZone: string): string {
  return formatter(intlLocale(locale), {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(ms);
}

export function formatDate(
  ms: number,
  locale: Locale,
  timeZone: string,
  style: "short" | "long" | "compact" = "long",
): string {
  const options: Intl.DateTimeFormatOptions =
    style === "long"
      ? { timeZone, weekday: "long", day: "numeric", month: "long" }
      : style === "short"
        ? { timeZone, weekday: "short", day: "numeric", month: "short" }
        : { timeZone, day: "numeric", month: "short" };
  return formatter(intlLocale(locale), options).format(ms);
}

/** Formats a calendar date string without shifting it through a time zone. */
export function formatDay(
  date: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" },
): string {
  return formatter(intlLocale(locale), { ...options, timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/** Weekday name, 0 = Sunday. */
export function weekdayName(weekday: number, locale: Locale, style: "long" | "short" = "long"): string {
  const aSunday = "2026-01-04";
  return formatDay(addDays(aSunday, weekday), locale, { weekday: style });
}

/** "2026-10-12T09:30" in a time zone -> instant. Used with datetime-local inputs. */
export function parseLocalDateTime(value: string, timeZone: string): number | null {
  const [date, clock] = value.split("T");
  if (!isDateString(date) || !clock) return null;
  const minutes = parseClock(clock.slice(0, 5));
  return minutes === null ? null : zonedTime(date, minutes, timeZone);
}

/** Instant -> "2026-10-12T09:30" in a time zone, for datetime-local inputs. */
export function toLocalDateTime(ms: number, timeZone: string): string {
  return `${localDate(ms, timeZone)}T${formatClock(localMinutes(ms, timeZone))}`;
}
