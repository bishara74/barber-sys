import { getLocale } from "next-intl/server";
import { localized } from "@/i18n/locales";
import { bookingServiceLabel } from "@/lib/booking-text";
import { findBookingByToken } from "@/lib/bookings";
import { getProfile } from "@/lib/config";
import { requestOrigin } from "@/lib/request";

const icsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (value: string) => value.replace(/[\\,;]/g, (char) => `\\${char}`).replace(/\n/g, "\\n");

/** The booking as a calendar file, so customers can add it to their phone's calendar. */
export async function GET(_request: Request, { params }: RouteContext<"/booking/[token]/calendar.ics">) {
  const { token } = await params;
  const booking = await findBookingByToken(token);
  if (!booking) return new Response("Not found", { status: 404 });

  const [locale, profile, origin] = await Promise.all([getLocale(), getProfile(), requestOrigin()]);
  const shop = localized(locale, profile.nameEn, profile.nameAr);
  const address = localized(locale, profile.addressEn, profile.addressAr);
  const service = bookingServiceLabel(booking, locale);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//barber-sys//booking//EN",
    "BEGIN:VEVENT",
    `UID:booking-${booking.id}@${new URL(origin).hostname}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(booking.startsAt)}`,
    `DTEND:${icsDate(booking.endsAt)}`,
    `SUMMARY:${icsText(shop ? `${service} · ${shop}` : service)}`,
    address ? `LOCATION:${icsText(address)}` : "",
    `URL:${origin}/booking/${token}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new Response(lines.join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="booking.ics"',
    },
  });
}
