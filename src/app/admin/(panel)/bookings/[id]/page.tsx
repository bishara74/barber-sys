import { MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { moveBooking, saveStaffNote } from "@/actions/bookings";
import { StatusBadge } from "@/components/admin/booking-status";
import { StatusActions } from "@/components/admin/status-actions";
import { Price } from "@/components/public/price";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { buttonClass } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/ui/card";
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
import { formatDate, formatTime, toLocalDateTime } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.booking");
  return { title: t("title") };
}

export default async function BookingPage({ params }: PageProps<"/admin/bookings/[id]">) {
  const user = await requireUser();
  const booking = await findBooking(Number((await params).id));
  if (!booking || !canManageStaffBookings(user, booking.staffId)) notFound();

  const { timeZone } = getDeploymentConfig();
  const [locale, t, ts, tc, staff, settings, profile, origin] = await Promise.all([
    getLocale(),
    getTranslations("admin.booking"),
    getTranslations("source"),
    getTranslations("common"),
    getStaff(),
    getSettings(),
    getProfile(),
    requestOrigin(),
  ]);

  const now = requestTime();
  const status = effectiveStatus(booking, now);
  const active = status === "pending" || status === "confirmed";
  const start = booking.startsAt.getTime();
  const service = bookingServiceLabel(booking, locale);
  const date = formatDate(start, locale, timeZone);
  const time = formatTime(start, locale, timeZone);
  const staffName = staff.find((member) => member.id === booking.staffId)?.name ?? "";
  const movableTo = staff.filter((member) => member.isActive && canManageStaffBookings(user, member.id));

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
      <PageHeader title={booking.customerName} actions={<StatusBadge status={status} className="text-sm" />} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section title={t("title")}>
            <dl className="space-y-3 text-sm">
              <Row label={t("service")}>{localized(locale, booking.serviceNameEn, booking.serviceNameAr)}</Row>
              {booking.options.length > 0 ? (
                <Row label={t("options")}>
                  {booking.options.map((option) => (
                    <span key={`${option.nameEn}-${option.nameAr}`} className="block">
                      {localized(locale, option.nameEn, option.nameAr)}
                      {option.priceDelta ? ` (+${formatMoney(option.priceDelta, settings.currency, locale)})` : ""}
                    </span>
                  ))}
                </Row>
              ) : null}
              <Row label={t("when")}>
                {date} · <span dir="ltr">{time}</span>
              </Row>
              <Row label={t("duration")}>{tc("minutes", { count: booking.durationMin })}</Row>
              <Row label={t("price")}>
                <Price amount={booking.price} isFrom={booking.priceIsFrom} currency={settings.currency} />
              </Row>
              <Row label={t("staff")}>{staffName}</Row>
              <Row label={t("source")}>{ts(booking.source)}</Row>
              <Row label={t("created")}>
                {formatDate(booking.createdAt.getTime(), locale, timeZone, "short")}{" "}
                <span dir="ltr">{formatTime(booking.createdAt.getTime(), locale, timeZone)}</span>
              </Row>
              {booking.customerNote ? <Row label={t("customerNote")}>{booking.customerNote}</Row> : null}
            </dl>
            {status === "pending" && booking.pendingExpiresAt ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {t("pendingUntil", {
                  time: `${formatDate(booking.pendingExpiresAt.getTime(), locale, timeZone, "short")} ${formatTime(booking.pendingExpiresAt.getTime(), locale, timeZone)}`,
                })}
              </p>
            ) : null}
            <StatusActions id={booking.id} status={status} />
          </Section>

          {active ? (
            <Section title={t("reschedule")}>
              <ActionForm action={moveBooking} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
                <input type="hidden" name="id" value={booking.id} />
                <SelectField
                  label={t("staff")}
                  name="staffId"
                  defaultValue={booking.staffId}
                  options={movableTo.map((member) => ({ value: member.id, label: member.name }))}
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
          <Section title={t("customer")}>
            <p className="font-medium">{booking.customerName}</p>
            {booking.customerPhone ? (
              <div className="flex flex-wrap gap-2">
                <a href={`tel:+${booking.customerPhone}`} className={buttonClass("outline", "sm")} dir="ltr">
                  <Phone className="size-4" aria-hidden />
                  {displayPhone(booking.customerPhone)}
                </a>
              </div>
            ) : null}
            {booking.customerPhone && messages.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted">{t("messageCustomer")}</p>
                {messages.map((message) => (
                  <a
                    key={message}
                    href={whatsappLink(booking.customerPhone, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary", "sm", "w-full justify-start")}
                  >
                    <MessageCircle className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{message}</span>
                  </a>
                ))}
              </div>
            ) : null}
            {booking.customerId ? (
              <Link href={`/admin/customers/${booking.customerId}`} className="text-sm text-primary underline">
                {t("viewCustomer")}
              </Link>
            ) : null}
          </Section>

          <Section title={t("staffNote")} description={t("staffNoteHint")}>
            <ActionForm action={saveStaffNote}>
              <input type="hidden" name="id" value={booking.id} />
              <TextareaField label={t("staffNote")} name="staffNote" defaultValue={booking.staffNote} rows={4} maxLength={2000} />
              <SubmitButton variant="outline">{tc("save")}</SubmitButton>
            </ActionForm>
          </Section>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="col-span-2">{children}</dd>
    </div>
  );
}
