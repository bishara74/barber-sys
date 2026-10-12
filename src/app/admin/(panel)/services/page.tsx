import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteServiceType, saveServiceType, setServiceArchived } from "@/actions/catalog";
import { BilingualFields } from "@/components/admin/bilingual-fields";
import { MoveButtons } from "@/components/admin/move-buttons";
import { Price } from "@/components/public/price";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { buttonClass } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, Section } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/field";
import { localized } from "@/i18n/locales";
import { requireOwner } from "@/lib/auth";
import { getArchivedServices, getCatalog } from "@/lib/catalog";
import { getSettings } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.services");
  return { title: t("title") };
}

export default async function ServicesPage() {
  await requireOwner();
  const [locale, t, tc, catalog, settings, archived] = await Promise.all([
    getLocale(),
    getTranslations("admin.services"),
    getTranslations("common"),
    getCatalog(),
    getSettings(),
    getArchivedServices(),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          catalog.length > 0 ? (
            <Link href="/admin/services/new" className={buttonClass("primary", "sm")}>
              <Plus className="size-4" aria-hidden />
              {t("addService")}
            </Link>
          ) : null
        }
      />

      <div className="space-y-5">
        <Section title={t("types")} description={t("typesHint")}>
          {catalog.length === 0 ? <EmptyState>{t("noTypes")}</EmptyState> : null}
          <ul className="space-y-3">
            {catalog.map((type, index) => (
              <li key={type.id} className="flex flex-wrap items-start gap-2 rounded-theme border border-border p-3">
                <ActionForm action={saveServiceType} className="min-w-0 flex-1">
                  <input type="hidden" name="id" value={type.id} />
                  <BilingualFields name="name" label={t("typeName")} defaults={{ en: type.nameEn, ar: type.nameAr }} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Checkbox name="isVisible" label={t("visible")} defaultChecked={type.isVisible} />
                    <SubmitButton variant="outline" size="sm">
                      {tc("save")}
                    </SubmitButton>
                  </div>
                </ActionForm>
                <div className="flex flex-col items-center">
                  <MoveButtons list="serviceType" id={type.id} isFirst={index === 0} isLast={index === catalog.length - 1} />
                  {type.services.length === 0 ? (
                    <ActionForm action={deleteServiceType} className="space-y-1">
                      <input type="hidden" name="id" value={type.id} />
                      <SubmitButton variant="ghost" size="icon" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
                        <Trash2 className="size-4" />
                      </SubmitButton>
                    </ActionForm>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <ActionForm action={saveServiceType} resetOnSuccess className="rounded-theme border border-dashed border-border p-3">
            <BilingualFields name="name" label={t("typeName")} />
            <input type="hidden" name="isVisible" value="on" />
            <SubmitButton variant="secondary" size="sm">
              <Plus className="size-4" aria-hidden />
              {t("addType")}
            </SubmitButton>
          </ActionForm>
        </Section>

        {catalog.map((type) => (
          <Section
            key={type.id}
            title={localized(locale, type.nameEn, type.nameAr)}
            actions={
              <Link href={`/admin/services/new?type=${type.id}`} className={buttonClass("outline", "sm")}>
                <Plus className="size-4" aria-hidden />
                {t("addService")}
              </Link>
            }
          >
            {type.services.length === 0 ? (
              <EmptyState>{t("noServices")}</EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {type.services.map((service, index) => (
                  <li key={service.id} className="flex items-center gap-2 py-2">
                    <Link href={`/admin/services/${service.id}`} className="min-w-0 flex-1 rounded-theme p-1 hover:bg-accent">
                      <span className="flex flex-wrap items-center gap-2 font-medium">
                        {localized(locale, service.nameEn, service.nameAr)}
                        {!service.isVisible ? <Badge>{tc("hidden")}</Badge> : null}
                        {!service.bookableOnline ? <Badge>{t("notOnline")}</Badge> : null}
                        {service.staffIds.length === 0 ? <Badge className="text-red-600">{t("noStaffAssigned")}</Badge> : null}
                      </span>
                      <span className="text-sm text-muted">
                        <Price amount={service.price} isFrom={service.priceIsFrom} currency={settings.currency} /> ·{" "}
                        {tc("minutes", { count: service.durationMin })}
                        {service.groups.length > 0 ? ` · ${t("optionGroups")}: ${service.groups.length}` : ""}
                      </span>
                    </Link>
                    <Link href={`/admin/services/${service.id}`} className={buttonClass("ghost", "icon")} aria-label={tc("edit")}>
                      <Pencil className="size-4" />
                    </Link>
                    <MoveButtons list="service" id={service.id} isFirst={index === 0} isLast={index === type.services.length - 1} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ))}

        {archived.length > 0 ? (
          <Section title={t("archivedList")}>
            <ul className="divide-y divide-border">
              {archived.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-muted">{localized(locale, service.nameEn, service.nameAr)}</span>
                  <form action={setServiceArchived}>
                    <input type="hidden" name="id" value={service.id} />
                    <input type="hidden" name="archived" value="false" />
                    <SubmitButton variant="outline" size="sm">
                      {t("unarchive")}
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    </>
  );
}
