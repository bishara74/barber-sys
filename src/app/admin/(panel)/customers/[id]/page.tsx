import { CalendarCheck2, CalendarX2, History, MessageCircle, NotebookPen, Phone, Trash2, UserX } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteCustomer, saveCustomer } from "@/actions/customers";
import { BackLink } from "@/components/admin/back-link";
import { StatusBadge } from "@/components/admin/booking-status";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { buttonClass } from "@/components/ui/button";
import { Avatar, EmptyState, PageHeader, Section, StatTile } from "@/components/ui/card";
import { InputField, TextareaField } from "@/components/ui/field";
import { RowLink, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { visibleStaffId } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { bookingServiceLabel } from "@/lib/booking-text";
import { effectiveStatus } from "@/lib/bookings";
import { getCustomer, getCustomerBookings } from "@/lib/customers";
import { getDeploymentConfig } from "@/lib/env";
import { displayPhone, whatsappLink } from "@/lib/phone";
import { requestTime } from "@/lib/request";
import { formatDate, formatTime } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.customers");
  return { title: t("title") };
}

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const user = await requireUser();
  const id = Number((await params).id);
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [locale, t, tc, history] = await Promise.all([
    getLocale(),
    getTranslations("admin.customers"),
    getTranslations("common"),
    getCustomerBookings(id),
  ]);
  const { timeZone } = getDeploymentConfig();
  const ownStaff = visibleStaffId(user, null);
  const visible = ownStaff === null ? history : history.filter((booking) => booking.staffId === ownStaff);
  const now = requestTime();
  const statuses = visible.map((booking) => effectiveStatus(booking, now));
  const count = (status: string) => statuses.filter((candidate) => candidate === status).length;

  return (
    <>
      <PageHeader
        back={<BackLink href="/admin/customers" label={t("title")} />}
        leading={<Avatar name={customer.name} className="size-14 text-lg" />}
        title={customer.name}
        description={
          <span dir="ltr" className="tabular-nums">
            {displayPhone(customer.phone)}
          </span>
        }
        actions={
          <>
            <a href={`tel:+${customer.phone}`} className={buttonClass("outline", "sm")}>
              <Phone className="size-4" aria-hidden />
              {t("call")}
            </a>
            <a
              href={whatsappLink(customer.phone, "")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "sm")}
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile label={t("visits")} value={count("completed")} icon={CalendarCheck2} tone="success" compact />
        <StatTile label={t("upcoming")} value={count("pending") + count("confirmed")} icon={History} tone="info" compact />
        <StatTile label={t("noShows")} value={count("no_show")} icon={UserX} tone="warning" compact />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <History className="size-4 text-primary" aria-hidden />
            {t("history")}
          </h2>
          {visible.length === 0 ? (
            <EmptyState icon={CalendarX2}>{t("noBookings")}</EmptyState>
          ) : (
            <Table>
              <TableHead>
                <TableHeader>{t("date")}</TableHeader>
                <TableHeader>{t("service")}</TableHeader>
                <TableHeader className="text-end">{t("status")}</TableHeader>
              </TableHead>
              <TableBody>
                {visible.map((booking, index) => {
                  const start = booking.startsAt.getTime();
                  return (
                    <TableRow key={booking.id} href={`/admin/bookings/${booking.id}`}>
                      <TableCell className="whitespace-nowrap">
                        <RowLink href={`/admin/bookings/${booking.id}`} className="block">
                          {formatDate(start, locale, timeZone, "short")}
                        </RowLink>
                        <span className="text-xs text-muted tabular-nums" dir="ltr">
                          {formatTime(start, locale, timeZone)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-56">
                        <span className="line-clamp-2">{bookingServiceLabel(booking, locale)}</span>
                      </TableCell>
                      <TableCell className="text-end">
                        <StatusBadge status={statuses[index]} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="space-y-5">
          <Section title={t("details")} icon={NotebookPen}>
            <ActionForm action={saveCustomer}>
              <input type="hidden" name="id" value={customer.id} />
              <InputField label={t("name")} name="name" required maxLength={80} defaultValue={customer.name} />
              <InputField
                label={t("phone")}
                name="phone"
                type="tel"
                dir="ltr"
                required
                maxLength={30}
                defaultValue={displayPhone(customer.phone)}
              />
              <TextareaField
                label={t("notes")}
                name="notes"
                rows={4}
                maxLength={2000}
                defaultValue={customer.notes}
                placeholder={t("notesPlaceholder")}
              />
              <SubmitButton>{tc("save")}</SubmitButton>
            </ActionForm>
          </Section>

          {user.role === "owner" ? (
            <Section title={t("deleteCustomer")} icon={Trash2} description={t("deleteHint")} className="border-red-500/30">
              <form action={deleteCustomer}>
                <input type="hidden" name="id" value={customer.id} />
                <SubmitButton variant="danger-ghost" className="border border-red-500/30" confirm={t("deleteConfirm")}>
                  <Trash2 className="size-4" aria-hidden />
                  {t("deleteCustomer")}
                </SubmitButton>
              </form>
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}
