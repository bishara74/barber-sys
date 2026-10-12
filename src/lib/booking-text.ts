import type { Booking } from "@/db/schema";
import { localized, type Locale } from "@/i18n/locales";

/** The service plus the chosen options, e.g. "Haircut + Beard, Wash". */
export function bookingServiceLabel(
  booking: Pick<Booking, "serviceNameEn" | "serviceNameAr" | "options">,
  locale: Locale,
): string {
  const service = localized(locale, booking.serviceNameEn, booking.serviceNameAr);
  const options = booking.options.map((option) => localized(locale, option.nameEn, option.nameAr));
  if (options.length === 0) return service;
  return `${service} + ${options.join(locale === "ar" ? "، " : ", ")}`;
}
