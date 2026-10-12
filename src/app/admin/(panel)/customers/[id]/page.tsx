import { MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { deleteCustomer, saveCustomer } from "@/actions/customers";
import { BookingRow } from "@/components/admin/booking-row";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, PageHeader, Section } from "@/components/ui/card";
import { InputField, TextareaField } from "@/components/ui/field";
import { visibleStaffId } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { effectiveStatus } from "@/lib/bookings";
import { getCustomer, getCustomerBookings } from "@/lib/customers";
import { getDeploymentConfig } from "@/lib/env";
import { displayPhone } from "@/lib/phone";
import { requestTime } from "@/lib/request";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.customers");
  return { title: t("title") };
}

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const user = await requireUser();
  const id = Number((await params).id);
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [t, tc, history] = await Promise.all([
    getTranslations("admin.customers"),
    getTranslations("common"),
    getCustomerBookings(id),
  ]);
  const { timeZone } = getDeploymentConfig();
  const ownStaff = visibleStaffId(user, null);
  const visible = ownStaff === null ? history : history.filter((booking) => booking.staffId === ownStaff);
  const now = requestTime();

  return (
    <>
      <PageHeader
        title={customer.name}
        actions={
          <>
            <a href={`tel:+${customer.phone}`} className={buttonClass("outline", "sm")} dir="ltr">
              <Phone className="size-4" aria-hidden />
              {displayPhone(customer.phone)}
            </a>
            <a href={`https://wa.me/${customer.phone}`} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "sm")}>
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={t("history")}>
          {visible.length === 0 ? (
            <EmptyState>{t("noBookings")}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((booking) => (
                <li key={booking.id}>
                  <BookingRow booking={booking} status={effectiveStatus(booking, now)} timeZone={timeZone} showDate />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="space-y-5">
          <Section title={t("notes")}>
            <ActionForm action={saveCustomer}>
              <input type="hidden" name="id" value={customer.id} />
              <InputField label={t("name")} name="name" required maxLength={80} defaultValue={customer.name} />
              <InputField label={t("phone")} name="phone" type="tel" dir="ltr" required defaultValue={displayPhone(customer.phone)} />
              <TextareaField label={t("notes")} name="notes" rows={4} maxLength={2000} defaultValue={customer.notes} />
              <SubmitButton>{tc("save")}</SubmitButton>
            </ActionForm>
          </Section>

          {user.role === "owner" ? (
            <Section title={t("deleteCustomer")} description={t("deleteHint")}>
              <form action={deleteCustomer}>
                <input type="hidden" name="id" value={customer.id} />
                <SubmitButton variant="danger" confirm={t("deleteConfirm")}>
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
