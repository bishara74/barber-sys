export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Locale used for dates and numbers. Arabic keeps Latin digits, which is what people expect locally. */
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-u-nu-latn" : "en-GB";
}

/** Picks the field for the current locale, falling back to the other language when empty. */
export function localized(locale: Locale, en: string, ar: string): string {
  return (locale === "ar" ? ar || en : en || ar) ?? "";
}
