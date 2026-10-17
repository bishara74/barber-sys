import {
  CalendarCheck2,
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  Clock,
  ExternalLink,
  Footprints,
  Hourglass,
  Link2,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BookingRow } from "@/components/admin/booking-row";
import { STATUS_DOT, StatusBadge } from "@/components/admin/booking-status";
import { CopyButton } from "@/components/admin/copy-button";
import { StatusActions } from "@/components/admin/status-actions";
import { buttonClass } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, Section, StatTile } from "@/components/ui/card";
import type { Booking } from "@/db/schema";
import { getBookingsInRange, getPendingBookings, visibleStaffId } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { bookingServiceLabel } from "@/lib/booking-text";
import { effectiveStatus } from "@/lib/bookings";
import { getStaff } from "@/lib/catalog";
import { getDeploymentConfig } from "@/lib/env";
import { requestOrigin, requestTime } from "@/lib/request";
import { addDays, formatDate, formatTime, localDate, localMinutes, MINUTE, zonedTime } from "@/lib/time";
import { cn, stagger } from "@/lib/utils";

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

  const [locale, t, tn, tc, staff, pending, todays, nextWeek, origin] = await Promise.all([
    getLocale(),
    getTranslations("admin.dashboard"),
    getTranslations("admin.nav"),
    getTranslations("common"),
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
  const doneToday = todays.filter((booking) => booking.status === "completed").length;
  const open = (booking: Booking) => ["pending", "confirmed"].includes(effectiveStatus(booking, now));
  const current = todays.find(
    (booking) => open(booking) && booking.startsAt.getTime() <= now && booking.endsAt.getTime() > now,
  );
  const next = todays.find((booking) => open(booking) && booking.startsAt.getTime() > now);

  const hour = localMinutes(now, timeZone) / 60;
  const firstName = user.name.trim().split(/\s+/)[0];
  const greeting =
    hour < 12
      ? t("greetingMorning", { name: firstName })
      : hour < 17
        ? t("greetingAfternoon", { name: firstName })
        : t("greetingEvening", { name: firstName });

  const waitText = (ms: number) => {
    const minutes = Math.max(1, Math.round(ms / MINUTE));
    return minutes < 60
      ? tc("minutes", { count: minutes })
      : t("hoursMinutes", { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
  };

  return (
    <>
      <PageHeader
        title={greeting}
        description={formatDate(now, locale, timeZone)}
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile
          label={t("agenda")}
          value={todays.length}
          icon={CalendarCheck2}
          hint={todays.length > 0 ? t("doneCount", { count: doneToday }) : undefined}
          className="animate-fade-up"
          style={stagger(0)}
        />
        <StatTile
          label={t("pending")}
          value={pending.length}
          icon={Hourglass}
          tone={pending.length > 0 ? "warning" : "success"}
          hint={pending.length === 0 ? t("allClear") : undefined}
          className="animate-fade-up"
          style={stagger(1)}
        />
        <StatTile
          label={t("upcoming")}
          value={upcomingCount}
          icon={CalendarDays}
          tone="info"
          className="col-span-2 animate-fade-up lg:col-span-1"
          style={stagger(2)}
        />
      </div>

      {/* Phones and tablets: next up, approvals, agenda, link. Wide screens: agenda beside the cards. */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:grid-rows-[auto_1fr]">
        <Card className="relative overflow-hidden xl:col-start-2 xl:row-start-1 xl:self-start">
          <div className="hero-fallback absolute inset-x-0 top-0 h-1.5" aria-hidden />
          {current || next ? (
            <NowCard
              booking={(current ?? next)!}
              label={current ? t("inProgress") : t("nextUp")}
              when={
                current
                  ? t("endsIn", { time: waitText(current.endsAt.getTime() - now) })
                  : t("startsIn", { time: waitText(next!.startsAt.getTime() - now) })
              }
              progress={
                current
                  ? (now - current.startsAt.getTime()) / (current.endsAt.getTime() - current.startsAt.getTime())
                  : null
              }
              time={`${formatTime((current ?? next)!.startsAt.getTime(), locale, timeZone)} – ${formatTime((current ?? next)!.endsAt.getTime(), locale, timeZone)}`}
              service={bookingServiceLabel((current ?? next)!, locale)}
              staffName={staffName((current ?? next)!.staffId)}
              openLabel={t("open")}
            />
          ) : (
            <div className="py-2 text-center">
              <p className="text-sm font-semibold">{t("nextUp")}</p>
              <p className="mt-1 text-sm text-muted">{t("noMoreToday")}</p>
            </div>
          )}
        </Card>

        <div className="min-w-0 space-y-5 xl:col-start-1 xl:row-span-2 xl:row-start-1">
          {pending.length > 0 ? (
            <Section
              title={t("pending")}
              icon={Hourglass}
              actions={<span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">{pending.length}</span>}
              className="border-amber-500/40"
            >
              <ul className="-mx-2 divide-y divide-border">
                {pending.map((booking) => (
                  <li key={booking.id} className="py-2">
                    <BookingRow
                      booking={booking}
                      status="pending"
                      timeZone={timeZone}
                      staffName={staffName(booking.staffId)}
                      showDate
                    />
                    <div className="flex justify-end px-2.5 pt-1">
                      <StatusActions id={booking.id} status="pending" compact />
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title={t("agenda")} icon={CalendarCheck2} description={t("bookingsCount", { count: todays.length })}>
            {todays.length === 0 ? (
              <EmptyState icon={Sparkles}>{t("nothingToday")}</EmptyState>
            ) : (
              <ol className="relative">
                {todays.map((booking, index) => {
                  const status = effectiveStatus(booking, now);
                  const start = booking.startsAt.getTime();
                  const past = booking.endsAt.getTime() <= now;
                  return (
                    <li
                      key={booking.id}
                      className={cn("relative flex animate-fade-up gap-3", past && "opacity-60")}
                      style={stagger(index)}
                    >
                      <div className="w-12 shrink-0 pt-3.5 text-end text-sm font-semibold tabular-nums" dir="ltr">
                        {formatTime(start, locale, timeZone)}
                      </div>
                      <div className="relative flex w-3 shrink-0 justify-center">
                        <span
                          className={cn(
                            "absolute w-px bg-border",
                            index === 0 ? "top-5" : "top-0",
                            index === todays.length - 1 ? "h-5" : "bottom-0",
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn("relative mt-4 size-3 rounded-full ring-4 ring-card", STATUS_DOT[status])}
                          aria-hidden
                        />
                      </div>
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="group mb-2 flex min-w-0 flex-1 items-start justify-between gap-3 rounded-theme border border-border bg-surface/40 p-3 transition hover:border-primary/40 hover:bg-primary-tint"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium group-hover:text-primary">{booking.customerName}</p>
                          <p className="truncate text-sm text-muted">{bookingServiceLabel(booking, locale)}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                            <Clock className="size-3" aria-hidden />
                            {tc("minutes", { count: booking.durationMin })}
                            {staffName(booking.staffId) ? ` · ${staffName(booking.staffId)}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={status} />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </Section>
        </div>

        <Section
          title={t("yourLink")}
          icon={Link2}
          description={t("yourLinkHint")}
          className="xl:col-start-2 xl:row-start-2 xl:self-start"
        >
            <p className="truncate rounded-theme bg-surface px-3 py-2 font-mono text-sm ring-1 ring-border" dir="ltr">
              {origin.replace(/^https?:\/\//, "")}
            </p>
            <div className="flex gap-2">
              <CopyButton value={origin} />
              <a href="/" target="_blank" className={buttonClass("ghost", "sm")}>
                <ExternalLink className="size-4" aria-hidden />
                {t("open")}
              </a>
            </div>
        </Section>
      </div>
    </>
  );
}

type NowCardProps = {
  booking: Booking;
  label: string;
  when: string;
  time: string;
  service: string;
  staffName?: string;
  progress: number | null;
  openLabel: string;
};

function NowCard({ booking, label, when, time, service, staffName, progress, openLabel }: NowCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50" />
            <span className="relative size-2 rounded-full bg-primary" />
          </span>
          {label}
        </span>
        <span className="text-xs text-muted">{when}</span>
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums" dir="ltr">
          {time}
        </p>
        <p className="mt-1 truncate font-medium">{booking.customerName}</p>
        <p className="truncate text-sm text-muted">
          {service}
          {staffName ? ` · ${staffName}` : ""}
        </p>
      </div>
      {progress !== null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-accent">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }} />
        </div>
      ) : null}
      <Link href={`/admin/bookings/${booking.id}`} className={buttonClass("secondary", "sm", "w-full")}>
        {openLabel}
      </Link>
    </div>
  );
}
