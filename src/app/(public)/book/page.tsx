import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BookingWizard } from "@/components/public/booking-wizard";
import { getActiveStaff, getBookableCatalog } from "@/lib/catalog";
import { catalogView } from "@/lib/catalog-view";
import { getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { requestTime } from "@/lib/request";
import { getBookingDays } from "@/lib/schedule";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("booking");
  return { title: t("title") };
}

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const { timeZone, turnstileSiteKey } = getDeploymentConfig();
  const [locale, settings, catalog, staff, query] = await Promise.all([
    getLocale(),
    getSettings(),
    getBookableCatalog(),
    getActiveStaff(),
    searchParams,
  ]);
  const days = await getBookingDays(settings, timeZone, requestTime());

  const requested = Number(query.service);

  return (
    <main className="page-glow min-h-screen px-4">
      <div className="mx-auto max-w-xl">
        <BookingWizard
          types={catalogView(catalog, locale)}
          staff={staff.map((member) => ({
            id: member.id,
            name: member.name,
            avatarUrl: member.avatarKey ? mediaUrl(member.avatarKey) : null,
          }))}
          allowStaffChoice={settings.allowStaffChoice}
          approvalMode={settings.bookingMode === "approval"}
          currency={settings.currency}
          timeZone={timeZone}
          turnstileSiteKey={turnstileSiteKey}
          days={days}
          initialServiceId={Number.isInteger(requested) ? requested : null}
        />
      </div>
    </main>
  );
}
