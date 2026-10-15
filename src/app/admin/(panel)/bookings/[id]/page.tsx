import {
  CalendarClock,
  Clock,
  Footprints,
  Globe,
  History,
  Hourglass,
  MessageCircle,
  MoveRight,
  NotebookPen,
  Phone,
  Quote,
  Scissors,
  Store,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { moveBooking, saveStaffNote } from "@/actions/bookings";
import { BackLink } from "@/components/admin/back-link";
import { StatusBadge } from "@/components/admin/booking-status";
import { StatusActions } from "@/components/admin/status-actions";
import { Price } from "@/components/public/price";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { buttonClass } from "@/components/ui/button";
import { Avatar, Card, PageHeader, Section } from "@/components/ui/card";
import { InputField, SelectField, TextareaField } from "@/components/ui/field";
import { localized } from "@/i18n/locales";
import { canManageStaffBookings, requireUser } from "@/lib/auth";
import { bookingServiceLabel } from "@/lib/booking-text";
import { effectiveStatus, findBooking } from "@/lib/bookings";
import { getStaff } from "@/lib/catalog";
import { getProfile, getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { displayPhone, whatsappLink } from "@/lib/phone";
import { requestOrigin, requestTime } from "@/lib/request";
import { formatDate, formatDay, formatTime, localDate, toLocalDateTime } from "@/lib/time";
import { mediaUrl } from "@/lib/utils";

const SOURCE_ICONS: Record<string, LucideIcon> = { online: Globe, admin: Store, walk_in: Footprints };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.booking");
  return { title: t("title") };
}

export default async function BookingPage({ params }: PageProps<"/admin/bookings/[id]">) {
  const user = await requireUser();
  const booking = await findBooking(Number((await params).id));
  if (!booking || !canManageStaffBookings(user, booking.staffId)) notFound();

  const { timeZone } = getDeploymentConfig();
  const [locale, t, ts, tc, tn, staff, settings, profile, origin] = await Promise.all([
    getLocale(),
    getTranslations("admin.booking"),
    getTranslations("source"),
    getTranslations("common"),
    getTranslations("admin.nav"),
    getStaff(),
    getSettings(),
    getProfile(),
    requestOrigin(),
  ]);

  const now = requestTime();
  const status = effectiveStatus(booking, now);
  const active = status === "pending" || status === "confirmed";
  const start = booking.startsAt.getTime();
  const day = localDate(start, timeZone);
  const service = bookingServiceLabel(booking, locale);
  const date = formatDate(start, locale, timeZone);
  const time = formatTime(start, locale, timeZone);
  const member = staff.find((candidate) => candidate.id === booking.staffId);
  const movableTo = staff.filter((candidate) => candidate.isActive && canManageStaffBookings(user, candidate.id));
  const SourceIcon = SOURCE_ICONS[booking.source] ?? Globe;

  const messageValues = {
    name: booking.customerName,
    service,
    date,
    time,
    shop: localized(locale, profile.nameEn, profile.nameAr),
    link: `${origin}/book`,
  };
  // Ready-made WhatsApp messages that fit the booking's status.
  const messages: string[] =
    status === "confirmed"
      ? [t("waConfirmed", messageValues), t("waReminder", messageValues)]
      : status === "declined" || status === "expired"
        ? [t("waDeclined", messageValues)]
        : status === "cancelled"
          ? [t("waCancelled", messageValues)]
          : [];

  return (
    <>
      <PageHeader
        back={<BackLink href={`/admin/calendar?view=day&date=${day}`} label={tn("calendar")} />}
        leading={<Avatar name={booking.customerName} className="size-12 text-base" />}
        title={booking.customerName}
        description={service}
        actions={<StatusBadge status={status} className="px-3 py-1 text-sm" />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex w-16 shrink-0 flex-col items-center rounded-theme bg-primary py-2 text-primary-foreground shadow-glow">
                <span className="text-xs font-medium opacity-90">{formatDay(day, locale, { month: "short" })}</span>
                <span className="text-2xl leading-tight font-bold tabular-nums">{formatDay(day, locale, { day: "numeric" })}</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold">{date}</p>
                <p className="text-muted tabular-nums" dir="ltr">
                  {time} – {formatTime(booking.endsAt.getTime(), locale, timeZone)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-2">
              <Detail icon={Scissors} label={t("service")}>
                {localized(locale, booking.serviceNameEn, booking.serviceNameAr)}
                {booking.options.length > 0 ? (
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {booking.options.map((option) => (
                      <span
                        key={`${option.nameEn}-${option.nameAr}`}
                        className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted"
                      >
                        {localized(locale, option.nameEn, option.nameAr)}
                        {option.priceDelta ? ` +${formatMoney(option.priceDelta, settings.currency, locale)}` : ""}
                      </span>
                    ))}
                  </span>
                ) : null}
              </Detail>
              <Detail icon={Wallet} label={t("price")}>
                <span className="font-semibold text-primary">
                  <Price amount={booking.price} isFrom={booking.priceIsFrom} currency={settings.currency} />
                </span>
              </Detail>
              <Detail icon={Clock} label={t("duration")}>
                {tc("minutes", { count: booking.durationMin })}
              </Detail>
              <Detail icon={UserRound} label={t("staff")}>
                <span className="inline-flex items-center gap-2">
                  <Avatar
                    name={member?.name ?? "?"}
                    src={member?.avatarKey ? mediaUrl(member.avatarKey) : null}
                    className="size-6 text-[10px]"
                    sizes="24px"
                  />
                  {member?.name ?? ""}
                </span>
              </Detail>
              <Detail icon={SourceIcon} label={t("source")}>
                {ts(booking.source)}
              </Detail>
              <Detail icon={CalendarClock} label={t("created")}>
                {formatDate(booking.createdAt.getTime(), locale, timeZone, "short")}{" "}
                <span dir="ltr">{formatTime(booking.createdAt.getTime(), locale, timeZone)}</span>
              </Detail>
            </dl>

            {booking.customerNote ? (
              <figure className="flex gap-3 rounded-theme bg-surface p-4 ring-1 ring-border">
                <Quote className="size-5 shrink-0 text-primary/60" aria-hidden />
                <div>
                  <figcaption className="text-xs font-medium text-muted">{t("customerNote")}</figcaption>
                  <blockquote className="mt-1 whitespace-pre-line text-sm">{booking.customerNote}</blockquote>
                </div>
              </figure>
            ) : null}

            {status === "pending" && booking.pendingExpiresAt ? (
              <p className="flex items-center gap-2 rounded-theme bg-amber-500/10 px-3.5 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-300">
                <Hourglass className="size-4 shrink-0" aria-hidden />
                {t("pendingUntil", {
                  time: `${formatDate(booking.pendingExpiresAt.getTime(), locale, timeZone, "short")} ${formatTime(booking.pendingExpiresAt.getTime(), locale, timeZone)}`,
                })}
              </p>
            ) : null}
            <StatusActions id={booking.id} status={status} />
          </Card>

          {active ? (
            <Section title={t("reschedule")} icon={MoveRight} description={t("rescheduleHint")}>
              <ActionForm action={moveBooking} className="grid grid-cols-1 gap-4 space-y-0 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <input type="hidden" name="id" value={booking.id} />
                <SelectField
                  label={t("staff")}
                  name="staffId"
                  defaultValue={booking.staffId}
                  options={movableTo.map((candidate) => ({ value: candidate.id, label: candidate.name }))}
                />
                <InputField
                  label={t("startsAt")}
                  name="startsAt"
                  type="datetime-local"
                  step={300}
                  required
                  defaultValue={toLocalDateTime(start, timeZone)}
                />
                <SubmitButton>{tc("save")}</SubmitButton>
              </ActionForm>
            </Section>
          ) : null}
        </div>

        <div className="space-y-5">
          <Section title={t("customer")} icon={UserRound}>
            <div className="flex items-center gap-3">
              <Avatar name={booking.customerName} />
              <div className="min-w-0">
                <p className="truncate font-medium">{booking.customerName}</p>
                {booking.customerPhone ? (
                  <p className="text-sm text-muted tabular-nums" dir="ltr">
                    {displayPhone(booking.customerPhone)}
                  </p>
                ) : null}
              </div>
            </div>
            {booking.customerPhone ? (
              <div className="grid grid-cols-2 gap-2">
                <a href={`tel:+${booking.customerPhone}`} className={buttonClass("outline", "sm")}>
                  <Phone className="size-4" aria-hidden />
                  {t("call")}
                </a>
                <a
                  href={whatsappLink(booking.customerPhone, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("outline", "sm")}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  WhatsApp
                </a>
              </div>
            ) : null}
            {booking.customerId ? (
              <Link
                href={`/admin/customers/${booking.customerId}`}
                className={buttonClass("ghost", "sm", "w-full justify-between text-primary")}
              >
                <span className="inline-flex items-center gap-2">
                  <History className="size-4" aria-hidden />
                  {t("viewCustomer")}
                </span>
                <MoveRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>
            ) : null}
          </Section>

          {booking.customerPhone && messages.length > 0 ? (
            <Section title={t("messageCustomer")} icon={MessageCircle} description={t("messageHint")}>
              <ul className="space-y-2">
                {messages.map((message) => (
                  <li key={message}>
                    <a
                      href={whatsappLink(booking.customerPhone, message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-theme border border-border bg-surface/60 p-3 text-sm transition hover:border-primary/40 hover:bg-primary-tint"
                    >
                      <span className="line-clamp-3 leading-relaxed text-foreground/85">{message}</span>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <MessageCircle className="size-3.5" aria-hidden />
                        {t("send")}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title={t("staffNote")} icon={NotebookPen} description={t("staffNoteHint")}>
            <ActionForm action={saveStaffNote}>
              <input type="hidden" name="id" value={booking.id} />
              <TextareaField label={t("staffNote")} name="staffNote" defaultValue={booking.staffNote} rows={4} maxLength={2000} />
              <SubmitButton variant="outline" size="sm">
                {tc("save")}
              </SubmitButton>
            </ActionForm>
          </Section>
        </div>
      </div>
    </>
  );
}

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-theme bg-accent text-muted">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}
