import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteStaff, updateStaff } from "@/actions/staff";
import { HoursEditor } from "@/components/admin/hours-editor";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { PageHeader, Section } from "@/components/ui/card";
import { Checkbox, InputField } from "@/components/ui/field";
import { ImageInput } from "@/components/ui/image-input";
import { localized } from "@/i18n/locales";
import { requireOwner } from "@/lib/auth";
import { getCatalog, getStaff } from "@/lib/catalog";
import { getStaffHours } from "@/lib/schedule";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.staff");
  return { title: t("title") };
}

export default async function StaffMemberPage({ params }: PageProps<"/admin/staff/[id]">) {
  await requireOwner();
  const id = Number((await params).id);
  const [locale, t, tc, staff, catalog, hours] = await Promise.all([
    getLocale(),
    getTranslations("admin.staff"),
    getTranslations("common"),
    getStaff(),
    getCatalog(),
    getStaffHours(id),
  ]);
  const member = staff.find((candidate) => candidate.id === id);
  if (!member) notFound();

  return (
    <>
      <PageHeader
        title={member.name}
        actions={
          <ActionForm action={deleteStaff} className="space-y-1">
            <input type="hidden" name="id" value={member.id} />
            <SubmitButton variant="outline" size="sm" className="text-red-600" confirm={tc("confirmDelete")}>
              {tc("delete")}
            </SubmitButton>
          </ActionForm>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={member.name} description={t("deleteHint")}>
          <ActionForm action={updateStaff}>
            <input type="hidden" name="id" value={member.id} />
            <InputField label={t("name")} name="name" required maxLength={80} defaultValue={member.name} />
            <Checkbox name="isActive" label={t("active")} defaultChecked={member.isActive} />
            <ImageInput
              name="avatar"
              label={t("photo")}
              currentUrl={member.avatarKey ? mediaUrl(member.avatarKey) : undefined}
              previewClassName="rounded-full"
            />
            {member.avatarKey ? <Checkbox name="removeAvatar" label={tc("delete")} /> : null}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("services")}</legend>
              {catalog.map((type) => (
                <div key={type.id} className="space-y-1.5">
                  <p className="text-xs text-muted">{localized(locale, type.nameEn, type.nameAr)}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {type.services.map((service) => (
                      <Checkbox
                        key={service.id}
                        name="serviceIds"
                        value={service.id}
                        label={localized(locale, service.nameEn, service.nameAr)}
                        defaultChecked={member.serviceIds.includes(service.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
            <SubmitButton>{tc("save")}</SubmitButton>
          </ActionForm>
        </Section>

        <Section title={t("hours")} description={t("hoursHint")}>
          <HoursEditor staffId={member.id} hours={hours} />
        </Section>
      </div>
    </>
  );
}
