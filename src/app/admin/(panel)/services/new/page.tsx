import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { BackLink } from "@/components/admin/back-link";
import { ServiceForm } from "@/components/admin/service-form";
import { PageHeader, Section } from "@/components/ui/card";
import { localized } from "@/i18n/locales";
import { requireOwner } from "@/lib/auth";
import { getActiveStaff, getCatalog } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.services");
  return { title: t("newService") };
}

export default async function NewServicePage({ searchParams }: PageProps<"/admin/services/new">) {
  await requireOwner();
  const [query, locale, t, catalog, staff] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("admin.services"),
    getCatalog(),
    getActiveStaff(),
  ]);
  if (catalog.length === 0) redirect("/admin/services");

  return (
    <>
      <PageHeader back={<BackLink href="/admin/services" label={t("title")} />} title={t("newService")} />
      <Section title={t("newService")} icon={Plus} className="max-w-3xl">
        <ServiceForm
          typeId={Number(query.type) || catalog[0].id}
          types={catalog.map((type) => ({ id: type.id, name: localized(locale, type.nameEn, type.nameAr) }))}
          staff={staff.map((member) => ({ id: member.id, name: member.name }))}
          assignedStaffIds={staff.map((member) => member.id)}
        />
      </Section>
    </>
  );
}
