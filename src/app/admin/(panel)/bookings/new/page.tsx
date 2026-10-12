import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ShopBookingForm } from "@/components/admin/shop-booking-form";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { canManageStaffBookings, requireUser } from "@/lib/auth";
import { getActiveStaff, getCatalog } from "@/lib/catalog";
import { catalogView } from "@/lib/catalog-view";
import { getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { requestTime } from "@/lib/request";
import { MINUTE, parseLocalDateTime, toLocalDateTime } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.booking");
  return { title: t("newTitle") };
}

export default async function NewBookingPage({ searchParams }: PageProps<"/admin/bookings/new">) {
  const user = await requireUser();
  const query = await searchParams;
  const { timeZone } = getDeploymentConfig();
  const [locale, t, catalog, allStaff, settings] = await Promise.all([
    getLocale(),
    getTranslations("admin.booking"),
    getCatalog(),
    getActiveStaff(),
    getSettings(),
  ]);

  const walkIn = query.walkIn === "1";
  const staff = allStaff.filter((member) => canManageStaffBookings(user, member.id));
  const requestedStaff = Number(query.staff);
  const defaultStaffId = staff.some((member) => member.id === requestedStaff)
    ? requestedStaff
    : (user.staffId ?? staff[0]?.id ?? null);

  // Walk-ins start now (rounded down to 5 minutes); otherwise use the clicked calendar slot.
  const requestedStart = typeof query.start === "string" ? parseLocalDateTime(query.start, timeZone) : null;
  const start = walkIn || requestedStart === null ? Math.floor(requestTime() / (5 * MINUTE)) * 5 * MINUTE : requestedStart;
  const types = catalogView(catalog, locale).filter((type) => type.services.length > 0);

  return (
    <>
      <PageHeader title={walkIn ? t("walkInTitle") : t("newTitle")} />
      {types.length === 0 || staff.length === 0 ? (
        <EmptyState>{t("nothingToBook")}</EmptyState>
      ) : (
        <ShopBookingForm
          types={types}
          staff={staff.map((member) => ({ id: member.id, name: member.name }))}
          defaultStart={toLocalDateTime(start, timeZone)}
          defaultStaffId={defaultStaffId}
          walkIn={walkIn}
          currency={settings.currency}
        />
      )}
    </>
  );
}
