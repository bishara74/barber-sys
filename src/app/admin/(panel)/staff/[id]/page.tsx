import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteStaff, updateStaff } from "@/actions/staff";
import { CalendarClock, Trash2, UserRound } from "lucide-react";
import { BackLink } from "@/components/admin/back-link";
import { HoursEditor } from "@/components/admin/hours-editor";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Avatar, PageHeader, Section } from "@/components/ui/card";
import { Checkbox, InputField, Switch, SwitchList } from "@/components/ui/field";
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
        back={<BackLink href="/admin/staff" label={t("title")} />}
        leading={
          <Avatar
            name={member.name}
            src={member.avatarKey ? mediaUrl(member.avatarKey) : null}
            className="size-14 text-lg"
            sizes="56px"
          />
        }
        title={member.name}
        actions={
          <ActionForm action={deleteStaff} className="space-y-1">
            <input type="hidden" name="id" value={member.id} />
            <SubmitButton variant="danger-ghost" size="sm" confirm={tc("confirmDelete")}>
              <Trash2 className="size-4" aria-hidden />
              {tc("delete")}
            </SubmitButton>
          </ActionForm>
        }
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title={t("profile")} icon={UserRound} description={t("deleteHint")} className="xl:self-start">
          <ActionForm action={updateStaff} className="space-y-5">
            <input type="hidden" name="id" value={member.id} />
            <InputField label={t("name")} name="name" required maxLength={80} defaultValue={member.name} />
            <SwitchList>
              <Switch name="isActive" label={t("active")} hint={t("activeHint")} defaultChecked={member.isActive} />
            </SwitchList>
            <ImageInput
              name="avatar"
              label={t("photo")}
              currentUrl={member.avatarKey ? mediaUrl(member.avatarKey) : undefined}
              previewClassName="rounded-full"
            />
            {member.avatarKey ? <Checkbox name="removeAvatar" label={t("removePhoto")} /> : null}
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium">{t("services")}</legend>
              {catalog.map((type) => (
                <div key={type.id} className="space-y-2">
                  <p className="text-xs font-medium text-muted">{localized(locale, type.nameEn, type.nameAr)}</p>
                  <div className="flex flex-wrap gap-2">
                    {type.services.map((service) => (
                      <Checkbox
                        key={service.id}
                        name="serviceIds"
                        value={service.id}
                        label={localized(locale, service.nameEn, service.nameAr)}
                        defaultChecked={member.serviceIds.includes(service.id)}
                        className="items-center rounded-full border border-border bg-card py-2 ps-2.5 pe-4 shadow-xs transition has-checked:border-primary has-checked:bg-primary-tint"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
            <SubmitButton>{tc("save")}</SubmitButton>
          </ActionForm>
        </Section>

        <Section title={t("hours")} icon={CalendarClock} description={t("hoursHint")}>
          <HoursEditor staffId={member.id} hours={hours} />
        </Section>
      </div>
    </>
  );
}
