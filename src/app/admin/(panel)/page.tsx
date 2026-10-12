import { CalendarOff, CalendarPlus, Footprints } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookingRow } from "@/components/admin/booking-row";
import { CopyButton } from "@/components/admin/copy-button";
import { StatusActions } from "@/components/admin/status-actions";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, PageHeader, Section } from "@/components/ui/card";
import { getBookingsInRange, getPendingBookings, visibleStaffId } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { effectiveStatus } from "@/lib/bookings";
import { getStaff } from "@/lib/catalog";
import { getDeploymentConfig } from "@/lib/env";
import { requestOrigin, requestTime } from "@/lib/request";
import { addDays, localDate, zonedTime } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dashboard");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { timeZone } = getDeploymentConfig();
  const now = requestTime();
  const today = localDate(now, timeZone);
  const staffId = visibleStaffId(user, null);

  const [t, tn, staff, pending, todays, nextWeek, origin] = await Promise.all([
    getTranslations("admin.dashboard"),
    getTranslations("admin.nav"),
    getStaff(),
    getPendingBookings(now, staffId),
    getBookingsInRange({
      from: zonedTime(today, 0, timeZone),
      to: zonedTime(addDays(today, 1), 0, timeZone),
      staffId,
    }),
    getBookingsInRange({
      from: now,
      to: zonedTime(addDays(today, 8), 0, timeZone),
      staffId,
      statuses: ["pending", "confirmed"],
    }),
    requestOrigin(),
  ]);

  const staffName = (id: number) =>
    staff.length > 1 ? staff.find((member) => member.id === id)?.name : undefined;
  const upcomingCount = nextWeek.filter((booking) => effectiveStatus(booking, now) !== "expired").length;

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <>
            <Link href="/admin/bookings/new" className={buttonClass("primary", "sm")}>
              <CalendarPlus className="size-4" aria-hidden />
              {tn("newBooking")}
            </Link>
            <Link href="/admin/bookings/new?walkIn=1" className={buttonClass("outline", "sm")}>
              <Footprints className="size-4" aria-hidden />
              {t("walkIn")}
            </Link>
            <Link href="/admin/time-off" className={buttonClass("outline", "sm")}>
              <CalendarOff className="size-4" aria-hidden />
              {t("blockTime")}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={t("pending")} className="lg:col-span-2">
          {pending.length === 0 ? (
            <EmptyState>{t("noPending")}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <BookingRow
                      booking={booking}
                      status="pending"
                      timeZone={timeZone}
                      staffName={staffName(booking.staffId)}
                      showDate
                    />
                  </div>
                  <StatusActions id={booking.id} status="pending" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("agenda")} description={t("bookingsCount", { count: todays.length })}>
          {todays.length === 0 ? (
            <EmptyState>{t("nothingToday")}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {todays.map((booking) => (
                <li key={booking.id}>
                  <BookingRow
                    booking={booking}
                    status={effectiveStatus(booking, now)}
                    timeZone={timeZone}
                    staffName={staffName(booking.staffId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="space-y-5">
          <Section title={t("upcoming")}>
            <p className="text-3xl font-semibold">{t("bookingsCount", { count: upcomingCount })}</p>
            <Link href="/admin/calendar?view=week" className={buttonClass("outline", "sm")}>
              {tn("calendar")}
            </Link>
          </Section>
          <Section title={t("yourLink")}>
            <p className="break-all text-sm text-muted" dir="ltr">
              {origin}
            </p>
            <CopyButton value={origin} />
          </Section>
        </div>
      </div>
    </>
  );
}
