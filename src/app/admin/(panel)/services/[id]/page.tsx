import { Archive, Layers, Pencil, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteService, setServiceArchived } from "@/actions/catalog";
import { BackLink } from "@/components/admin/back-link";
import { OptionGroupsEditor } from "@/components/admin/option-groups-editor";
import { ServiceForm } from "@/components/admin/service-form";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { PageHeader, Section } from "@/components/ui/card";
import { localized } from "@/i18n/locales";
import { requireOwner } from "@/lib/auth";
import { findService, getCatalog, getStaff } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.services");
  return { title: t("editService") };
}

export default async function EditServicePage({ params }: PageProps<"/admin/services/[id]">) {
  await requireOwner();
  const service = await findService(Number((await params).id));
  if (!service) notFound();

  const [locale, t, tc, catalog, staff] = await Promise.all([
    getLocale(),
    getTranslations("admin.services"),
    getTranslations("common"),
    getCatalog(),
    getStaff(),
  ]);
  const assigned = staff.filter((member) => member.serviceIds.includes(service.id)).map((member) => member.id);

  return (
    <>
      <PageHeader
        back={<BackLink href="/admin/services" label={t("title")} />}
        title={localized(locale, service.nameEn, service.nameAr)}
        actions={
          <>
            <form action={setServiceArchived}>
              <input type="hidden" name="id" value={service.id} />
              <input type="hidden" name="archived" value="true" />
              <SubmitButton variant="outline" size="sm">
                <Archive className="size-4" aria-hidden />
                {t("archive")}
              </SubmitButton>
            </form>
            <ActionForm action={deleteService} className="space-y-1">
              <input type="hidden" name="id" value={service.id} />
              <SubmitButton variant="danger-ghost" size="sm" confirm={tc("confirmDelete")}>
                <Trash2 className="size-4" aria-hidden />
                {tc("delete")}
              </SubmitButton>
            </ActionForm>
          </>
        }
      />
      <div className="space-y-5">
        <Section title={t("editService")} icon={Pencil}>
          <ServiceForm
            service={service}
            types={catalog.map((type) => ({ id: type.id, name: localized(locale, type.nameEn, type.nameAr) }))}
            staff={staff
              .filter((member) => member.isActive || assigned.includes(member.id))
              .map((member) => ({ id: member.id, name: member.name }))}
            assignedStaffIds={assigned}
          />
        </Section>
        <Section title={t("optionGroups")} icon={Layers} description={t("optionGroupsHint")}>
          <OptionGroupsEditor serviceId={service.id} groups={service.groups} />
        </Section>
      </div>
    </>
  );
}
