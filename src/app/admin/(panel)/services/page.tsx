import { Archive, ArchiveRestore, Clock, FolderTree, Layers, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/field";
import { RowLink, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const typesSection = (
    <Section title={t("types")} icon={FolderTree} description={t("typesHint")}>
      {catalog.length === 0 ? <EmptyState icon={FolderTree}>{t("noTypes")}</EmptyState> : null}
      <ul className="space-y-3">
        {catalog.map((type, index) => (
          <li key={type.id} className="flex items-start gap-2 rounded-theme border border-border bg-surface/40 p-3 sm:p-4">
            <ActionForm action={saveServiceType} className="min-w-0 flex-1">
              <input type="hidden" name="id" value={type.id} />
              <BilingualFields name="name" label={t("typeName")} defaults={{ en: type.nameEn, ar: type.nameAr }} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Switch name="isVisible" label={t("visible")} defaultChecked={type.isVisible} inline />
                <SubmitButton variant="outline" size="sm">
                  {tc("save")}
                </SubmitButton>
              </div>
            </ActionForm>
            <div className="flex flex-col items-center">
              <MoveButtons list="serviceType" id={type.id} isFirst={index === 0} isLast={index === catalog.length - 1} vertical />
              {type.services.length === 0 ? (
                <ActionForm action={deleteServiceType} className="space-y-1">
                  <input type="hidden" name="id" value={type.id} />
                  <SubmitButton variant="danger-ghost" size="icon-sm" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
                    <Trash2 className="size-4" />
                  </SubmitButton>
                </ActionForm>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <ActionForm action={saveServiceType} resetOnSuccess className="rounded-theme border-2 border-dashed border-border p-3 sm:p-4">
        <BilingualFields name="name" label={t("typeName")} />
        <input type="hidden" name="isVisible" value="on" />
        <SubmitButton variant="secondary" size="sm">
          <Plus className="size-4" aria-hidden />
          {t("addType")}
        </SubmitButton>
      </ActionForm>
    </Section>
  );

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("pageHint")}
        actions={
          catalog.length > 0 ? (
            <Link href="/admin/services/new" className={buttonClass("primary", "sm")}>
              <Plus className="size-4" aria-hidden />
              {t("addService")}
            </Link>
          ) : null
        }
      />

      <div className="space-y-6">
        {catalog.length === 0 ? typesSection : null}

        {catalog.map((type) => (
          <section key={type.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold">
                <span className="flex size-8 items-center justify-center rounded-theme bg-primary-soft text-primary">
                  <Scissors className="size-4" aria-hidden />
                </span>
                {localized(locale, type.nameEn, type.nameAr)}
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted tabular-nums">
                  {type.services.length}
                </span>
                {!type.isVisible ? <Badge>{tc("hidden")}</Badge> : null}
              </h2>
              <Link href={`/admin/services/new?type=${type.id}`} className={buttonClass("outline", "sm")}>
                <Plus className="size-4" aria-hidden />
                {t("addService")}
              </Link>
            </div>
            {type.services.length === 0 ? (
              <EmptyState icon={Scissors}>{t("noServices")}</EmptyState>
            ) : (
              <Table>
                <TableHead>
                  <TableHeader>{t("name")}</TableHeader>
                  <TableHeader className="hidden sm:table-cell">{t("durationShort")}</TableHeader>
                  <TableHeader>{t("price")}</TableHeader>
                  <TableHeader className="w-px">
                    <span className="sr-only">{tc("edit")}</span>
                  </TableHeader>
                </TableHead>
                <TableBody>
                  {type.services.map((service, index) => (
                    <TableRow key={service.id} href={`/admin/services/${service.id}`}>
                      <TableCell>
                        <RowLink href={`/admin/services/${service.id}`}>{localized(locale, service.nameEn, service.nameAr)}</RowLink>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs text-muted sm:hidden">
                            <Clock className="size-3" aria-hidden />
                            {tc("minutes", { count: service.durationMin })}
                          </span>
                          {!service.isVisible ? <Badge>{tc("hidden")}</Badge> : null}
                          {!service.bookableOnline ? <Badge tone="info">{t("notOnline")}</Badge> : null}
                          {service.staffIds.length === 0 ? <Badge tone="danger">{t("noStaffAssigned")}</Badge> : null}
                          {service.groups.length > 0 ? (
                            <Badge tone="primary">
                              <Layers className="size-3" aria-hidden />
                              {t("optionsCount", { count: service.groups.length })}
                            </Badge>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted sm:table-cell">
                        {tc("minutes", { count: service.durationMin })}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        <Price amount={service.price} isFrom={service.priceIsFrom} currency={settings.currency} />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/admin/services/${service.id}`}
                            className={buttonClass("ghost", "icon-sm", "text-muted")}
                            aria-label={tc("edit")}
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <MoveButtons list="service" id={service.id} isFirst={index === 0} isLast={index === type.services.length - 1} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        ))}

        {catalog.length > 0 ? typesSection : null}

        {archived.length > 0 ? (
          <Section title={t("archivedList")} icon={Archive} description={t("archivedHint")}>
            <ul className="divide-y divide-border">
              {archived.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-muted">{localized(locale, service.nameEn, service.nameAr)}</span>
                  <form action={setServiceArchived}>
                    <input type="hidden" name="id" value={service.id} />
                    <input type="hidden" name="archived" value="false" />
                    <SubmitButton variant="outline" size="sm">
                      <ArchiveRestore className="size-4" aria-hidden />
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
