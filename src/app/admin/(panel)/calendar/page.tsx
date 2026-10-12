import { CalendarOff, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MonthGrid } from "@/components/admin/calendar/month-grid";
import { StaffFilter } from "@/components/admin/calendar/staff-filter";
import { TimeGrid, type GridColumn } from "@/components/admin/calendar/time-grid";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { getBookingsInRange, getTimeOffInRange, visibleStaffId } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { getActiveStaff } from "@/lib/catalog";
import { getDeploymentConfig } from "@/lib/env";
import { requestTime } from "@/lib/request";
import { getWeeklyHours } from "@/lib/schedule";
import {
  addDays,
  addMonths,
  formatDay,
  isDateString,
  localDate,
  localMinutes,
  startOfMonth,
  startOfWeek,
  zonedTime,
} from "@/lib/time";
import { cn } from "@/lib/utils";

const VIEWS = ["day", "week", "month"] as const;
type View = (typeof VIEWS)[number];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("calendar") };
}

function rangeFor(view: View, date: string) {
  if (view === "day") return { first: date, end: addDays(date, 1), prev: addDays(date, -1), next: addDays(date, 1) };
  if (view === "week") {
    const first = startOfWeek(date);
    return { first, end: addDays(first, 7), prev: addDays(first, -7), next: addDays(first, 7) };
  }
  const first = startOfMonth(date);
  return { first, end: addMonths(first, 1), prev: addMonths(first, -1), next: addMonths(first, 1) };
}

export default async function CalendarPage({ searchParams }: PageProps<"/admin/calendar">) {
  const user = await requireUser();
  const query = await searchParams;
  const { timeZone } = getDeploymentConfig();
  const now = requestTime();

  const view: View = VIEWS.includes(query.view as View) ? (query.view as View) : "day";
  const date = isDateString(query.date) ? query.date : localDate(now, timeZone);
  const requestedStaff = Number(query.staff);
  const staffId = visibleStaffId(user, Number.isInteger(requestedStaff) && requestedStaff > 0 ? requestedStaff : null);
  const { first, end, prev, next } = rangeFor(view, date);
  const from = zonedTime(first, 0, timeZone);
  const to = zonedTime(end, 0, timeZone);

  const [locale, t, tn, allStaff, bookings, blocks, weekly] = await Promise.all([
    getLocale(),
    getTranslations("admin.calendar"),
    getTranslations("admin.nav"),
    getActiveStaff(),
    getBookingsInRange({ from, to, staffId }),
    getTimeOffInRange({ from, to, staffId }),
    getWeeklyHours(),
  ]);
  const staff = staffId === null ? allStaff : allStaff.filter((member) => member.id === staffId);

  // Show working hours, widened to fit any booking outside them.
  const shiftEdges = weekly.flat();
  let startHour = shiftEdges.length ? Math.floor(Math.min(...shiftEdges.map((s) => s.startMin)) / 60) : 8;
  let endHour = shiftEdges.length ? Math.ceil(Math.max(...shiftEdges.map((s) => s.endMin)) / 60) : 20;
  for (const booking of bookings) {
    startHour = Math.min(startHour, Math.floor(localMinutes(booking.startsAt.getTime(), timeZone) / 60));
    endHour = Math.max(endHour, Math.ceil(localMinutes(booking.endsAt.getTime(), timeZone) / 60) || 24);
  }

  const staffParam = staffId !== null && user.role === "owner" ? `&staff=${staffId}` : "";
  const href = (params: { view?: View; date?: string }) =>
    `/admin/calendar?view=${params.view ?? view}&date=${params.date ?? date}${staffParam}`;

  const onDay = (day: string) => {
    const dayStart = zonedTime(day, 0, timeZone);
    const dayEnd = zonedTime(addDays(day, 1), 0, timeZone);
    const within = <T extends { startsAt: Date; endsAt: Date }>(item: T) =>
      item.startsAt.getTime() < dayEnd && item.endsAt.getTime() > dayStart;
    return { bookings: bookings.filter(within), blocks: blocks.filter(within) };
  };

  let columns: GridColumn[] = [];
  if (view === "week") {
    columns = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(first, i);
      return {
        key: day,
        label: formatDay(day, locale),
        date: day,
        staffId: staff.length === 1 ? staff[0].id : null,
        ...onDay(day),
      };
    });
  } else if (view === "day") {
    const day = onDay(date);
    columns = staff.map((member) => ({
      key: String(member.id),
      label: member.name,
      date,
      staffId: member.id,
      bookings: day.bookings.filter((booking) => booking.staffId === member.id),
      blocks: day.blocks.filter((block) => block.staffId === null || block.staffId === member.id),
    }));
  }

  const title =
    view === "month"
      ? formatDay(first, locale, { month: "long", year: "numeric" })
      : view === "week"
        ? `${formatDay(first, locale, { day: "numeric", month: "short" })} – ${formatDay(addDays(first, 6), locale, { day: "numeric", month: "short" })}`
        : formatDay(date, locale, { weekday: "long", day: "numeric", month: "long" });
  const [PrevIcon, NextIcon] = locale === "ar" ? [ChevronRight, ChevronLeft] : [ChevronLeft, ChevronRight];

  return (
    <>
      <PageHeader
        title={tn("calendar")}
        actions={
          <>
            <Link href={`/admin/bookings/new?start=${date}T09:00`} className={buttonClass("primary", "sm")}>
              <CalendarPlus className="size-4" aria-hidden />
              {tn("newBooking")}
            </Link>
            <Link href="/admin/time-off" className={buttonClass("outline", "sm")}>
              <CalendarOff className="size-4" aria-hidden />
              {tn("timeOff")}
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-theme border border-border bg-card p-0.5">
          {VIEWS.map((option) => (
            <Link
              key={option}
              href={href({ view: option })}
              className={cn(
                "rounded-theme px-3 py-1.5 text-sm",
                option === view ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              {t(option)}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Link href={href({ date: prev })} className={buttonClass("ghost", "icon")} aria-label={t("previous")}>
            <PrevIcon className="size-5" />
          </Link>
          <Link href={href({ date: localDate(now, timeZone) })} className={buttonClass("outline", "sm")}>
            {t("today")}
          </Link>
          <Link href={href({ date: next })} className={buttonClass("ghost", "icon")} aria-label={t("next")}>
            <NextIcon className="size-5" />
          </Link>
        </div>
        <h2 className="flex-1 font-semibold">{title}</h2>
        {user.role === "owner" && allStaff.length > 1 ? <StaffFilter staff={allStaff} value={staffId} /> : null}
      </div>

      {allStaff.length === 0 ? (
        <EmptyState>{t("noStaff")}</EmptyState>
      ) : view === "month" ? (
        <MonthGrid month={first} bookings={bookings} timeZone={timeZone} now={now} linkParams={staffParam} />
      ) : (
        <TimeGrid columns={columns} startHour={startHour} endHour={Math.min(endHour, 24)} timeZone={timeZone} now={now} />
      )}
    </>
  );
}
