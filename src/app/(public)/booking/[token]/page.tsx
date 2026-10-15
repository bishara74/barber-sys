import { CalendarClock, CalendarPlus, Info, MessageCircle, RotateCcw, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { cancelBooking } from "@/actions/public";
import { StatusMark, Ticket, TicketRow } from "@/components/public/booking-ticket";
import { Price } from "@/components/public/price";
import { ShopMark } from "@/components/shop-mark";
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
import { formatDate, formatDay, formatTime, localDate } from "@/lib/time";
import { stagger } from "@/lib/utils";

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
  const day = localDate(startsAt, timeZone);
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
    <main className="page-glow min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <StatusMark status={status} />
          <h1 className="mt-5 animate-fade-up text-2xl font-bold">{query.new ? t("received") : t("title")}</h1>
          {query.moved ? (
            <p className="mt-2 inline-flex animate-fade-up items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CalendarClock className="size-4" aria-hidden />
              {t("rescheduled")}
            </p>
          ) : null}
          <p className="mx-auto mt-2 max-w-sm animate-fade-up text-muted">{message}</p>
        </div>

        <Ticket
          month={formatDay(day, locale, { month: "short" })}
          day={formatDay(day, locale, { day: "numeric" })}
          title={date}
          subtitle={
            <span dir="ltr">
              {time} – {formatTime(booking.endsAt.getTime(), locale, timeZone)}
            </span>
          }
          dimmed={!active && status !== "completed"}
        >
          <TicketRow label={t("service")}>{service}</TicketRow>
          {staffName ? <TicketRow label={tb("with")}>{staffName}</TicketRow> : null}
          <TicketRow label={tb("duration")}>{tc("minutes", { count: booking.durationMin })}</TicketRow>
          <TicketRow label={t("price")} strong>
            <Price amount={booking.price} isFrom={booking.priceIsFrom} currency={settings.currency} />
          </TicketRow>
        </Ticket>

        <div className="animate-fade-up space-y-3" style={stagger(4)}>
          {active && profile.whatsapp ? (
            <a
              href={whatsappLink(profile.whatsapp, whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass(query.new ? "primary" : "outline", "lg", query.new ? "btn-shine w-full" : "w-full")}
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
              <Link href={`/booking/${token}/reschedule`} className={buttonClass("secondary", "md", "w-full")}>
                <CalendarClock className="size-4" aria-hidden />
                {t("reschedule")}
              </Link>
              <form action={cancelBooking}>
                <input type="hidden" name="token" value={token} />
                <SubmitButton variant="danger-ghost" className="w-full border border-red-500/25" confirm={t("cancelConfirm")}>
                  <XCircle className="size-4" aria-hidden />
                  {t("cancel")}
                </SubmitButton>
              </form>
            </div>
          ) : null}

          {!active ? (
            <Link href="/book" className={buttonClass("primary", "lg", "w-full")}>
              <RotateCcw className="size-5" aria-hidden />
              {t("bookAgain")}
            </Link>
          ) : null}

          {canChange || active ? (
            <p className="flex items-start gap-2 rounded-theme bg-card px-3.5 py-3 text-xs leading-relaxed text-muted ring-1 ring-border">
              <Info className="mt-px size-4 shrink-0 text-primary" aria-hidden />
              {canChange ? `${t("keepLink")} ${t("changeWindow", { hours: settings.cancelWindowHours })}` : t("tooLate")}
            </p>
          ) : null}
        </div>

        {shopName ? (
          <Link
            href="/"
            className="mx-auto flex w-fit items-center gap-2.5 rounded-full py-1.5 ps-1.5 pe-4 text-sm font-medium text-muted transition hover:bg-card hover:text-foreground"
          >
            <ShopMark name={shopName} logoKey={profile.avatarKey} className="size-7 text-xs" sizes="28px" />
            {shopName}
          </Link>
        ) : null}
      </div>
    </main>
  );
}
