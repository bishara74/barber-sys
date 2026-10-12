import { ArrowLeft, ArrowRight } from "lucide-react";
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

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-5 px-4 py-6">
      <Link href={`/booking/${token}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <Back className="size-4" aria-hidden />
        {t("title")}
      </Link>
      <div>
        <h1 className="text-xl font-bold">{t("pickNewTime")}</h1>
        <p className="text-muted">{bookingServiceLabel(booking, locale)}</p>
      </div>
      <ReschedulePicker token={token} days={days} timeZone={timeZone} />
    </main>
  );
}
