import { ArrowLeft, ArrowRight, CalendarClock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ReschedulePicker } from "@/components/public/reschedule-picker";
import { bookingServiceLabel } from "@/lib/booking-text";
import { customerCanChange, findBookingByToken } from "@/lib/bookings";
import { getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { requestTime } from "@/lib/request";
import { getBookingDays } from "@/lib/schedule";
import { formatDate, formatTime } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("manage");
  return { title: t("pickNewTime"), robots: { index: false } };
}

export default async function ReschedulePage({ params }: PageProps<"/booking/[token]/reschedule">) {
  const { token } = await params;
  const booking = await findBookingByToken(token);
  if (!booking) notFound();

  const settings = await getSettings();
  const now = requestTime();
  if (!customerCanChange(booking, settings, now)) redirect(`/booking/${token}`);

  const { timeZone } = getDeploymentConfig();
  const [locale, t, days] = await Promise.all([
    getLocale(),
    getTranslations("manage"),
    getBookingDays(settings, timeZone, now),
  ]);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const start = booking.startsAt.getTime();

  return (
    <main className="page-glow min-h-screen px-4 pt-4 pb-32">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href={`/booking/${token}`}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-xs transition hover:border-primary/40"
          aria-label={t("title")}
        >
          <Back className="size-[18px]" />
        </Link>
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold">{t("pickNewTime")}</h1>
          <p className="mt-1 text-muted">{bookingServiceLabel(booking, locale)}</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm text-muted ring-1 ring-border">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            <span className="line-through decoration-muted/60">
              {formatDate(start, locale, timeZone, "short")} · <span dir="ltr">{formatTime(start, locale, timeZone)}</span>
            </span>
          </p>
        </div>
        <ReschedulePicker token={token} days={days} timeZone={timeZone} />
      </div>
    </main>
  );
}
