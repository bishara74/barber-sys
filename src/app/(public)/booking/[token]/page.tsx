import { CalendarPlus, CheckCircle2, MessageCircle, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { cancelBooking } from "@/actions/public";
import { Price } from "@/components/public/price";
import { SubmitButton } from "@/components/ui/action-form";
import { buttonClass } from "@/components/ui/button";
import { localized } from "@/i18n/locales";
import { bookingServiceLabel } from "@/lib/booking-text";
import { customerCanChange, effectiveStatus, findBookingByToken } from "@/lib/bookings";
import { getStaff } from "@/lib/catalog";
import { getProfile, getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { whatsappLink } from "@/lib/phone";
import { requestOrigin, requestTime } from "@/lib/request";
import { formatDate, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("manage");
  return { title: t("title"), robots: { index: false } };
}

export default async function ManageBookingPage({ params, searchParams }: PageProps<"/booking/[token]">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const booking = await findBookingByToken(token);
  if (!booking) notFound();

  const { timeZone } = getDeploymentConfig();
  const [locale, t, tb, tc, settings, profile, staff, origin] = await Promise.all([
    getLocale(),
    getTranslations("manage"),
    getTranslations("booking"),
    getTranslations("common"),
    getSettings(),
    getProfile(),
    getStaff(),
    requestOrigin(),
  ]);

  const now = requestTime();
  const status = effectiveStatus(booking, now);
  const active = status === "pending" || status === "confirmed";
  const canChange = customerCanChange(booking, settings, now);
  const startsAt = booking.startsAt.getTime();
  const service = bookingServiceLabel(booking, locale);
  const date = formatDate(startsAt, locale, timeZone);
  const time = formatTime(startsAt, locale, timeZone);
  const staffName = staff.find((member) => member.id === booking.staffId)?.name;
  const shopName = localized(locale, profile.nameEn, profile.nameAr);

  const heldUntil = booking.pendingExpiresAt?.getTime() ?? startsAt;
  const message =
    status === "pending"
      ? t("pending", {
          time: `${formatDate(heldUntil, locale, timeZone, "short")} ${formatTime(heldUntil, locale, timeZone)}`,
        })
      : t(status);
  const whatsappText = t("whatsappMessage", {
    service,
    date,
    time,
    name: booking.customerName,
    link: `${origin}/booking/${token}`,
  });

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-5 px-4 py-8">
      <div className="text-center">
        {active ? (
          <CheckCircle2 className={cn("mx-auto size-12", status === "pending" ? "text-amber-500" : "text-emerald-500")} aria-hidden />
        ) : (
          <XCircle className="mx-auto size-12 text-muted" aria-hidden />
        )}
        <h1 className="mt-3 text-2xl font-bold">{query.new ? t("received") : t("title")}</h1>
        {shopName ? <p className="text-sm text-muted">{shopName}</p> : null}
        {query.moved ? <p className="mt-1 font-medium text-emerald-600">{t("rescheduled")}</p> : null}
        <p className="mt-2 text-muted">{message}</p>
      </div>

      <dl className="space-y-3 rounded-theme border border-border bg-card p-4 text-sm">
        <Row label={t("service")}>{service}</Row>
        {staffName ? <Row label={tb("with")}>{staffName}</Row> : null}
        <Row label={tb("when")}>
          {date} · <span dir="ltr">{time}</span>
        </Row>
        <Row label={tb("duration")}>{tc("minutes", { count: booking.durationMin })}</Row>
        <Row label={t("price")}>
          <Price amount={booking.price} isFrom={booking.priceIsFrom} currency={settings.currency} />
        </Row>
      </dl>

      {active && profile.whatsapp ? (
        <a
          href={whatsappLink(profile.whatsapp, whatsappText)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass(query.new ? "primary" : "outline", "lg", "w-full")}
        >
          <MessageCircle className="size-5" aria-hidden />
          {t("sendOnWhatsApp")}
        </a>
      ) : null}

      {active ? (
        <a href={`/booking/${token}/calendar.ics`} className={buttonClass("outline", "lg", "w-full")}>
          <CalendarPlus className="size-5" aria-hidden />
          {t("addToCalendar")}
        </a>
      ) : null}

      {canChange ? (
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/booking/${token}/reschedule`} className={buttonClass("secondary", "md")}>
            {t("reschedule")}
          </Link>
          <form action={cancelBooking}>
            <input type="hidden" name="token" value={token} />
            <SubmitButton variant="outline" className="w-full text-red-600" confirm={t("cancelConfirm")}>
              {t("cancel")}
            </SubmitButton>
          </form>
        </div>
      ) : null}

      <p className="text-center text-xs text-muted">
        {canChange ? `${t("keepLink")} ${t("changeWindow", { hours: settings.cancelWindowHours })}` : active ? t("tooLate") : null}
      </p>

      {!active ? (
        <Link href="/book" className={buttonClass("primary", "lg", "w-full")}>
          {t("bookAgain")}
        </Link>
      ) : null}
    </main>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-medium">{children}</dd>
    </div>
  );
}
