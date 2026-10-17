import { intlLocale, type Locale } from "@/i18n/locales";

/** Formats minor units (agorot, cents) as currency. Whole amounts drop the decimals. */
export function formatMoney(minor: number, currency: string, locale: Locale): string {
  const whole = minor % 100 === 0;
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** "45" or "45.5" -> 4500 / 4550. Empty input -> null. Invalid input -> NaN. */
export function parseMoney(input: string): number | null {
  const value = input.trim().replace(",", ".");
  if (value === "") return null;
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) return Number.NaN;
  return Math.round(Number(value) * 100);
}

/** Minor units -> value for a form input ("45", "45.5"). */
export function moneyInputValue(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "";
  return String(minor / 100);
}
