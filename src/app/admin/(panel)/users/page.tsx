import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createUser, deleteUser, updateUser } from "@/actions/users";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Badge, PageHeader, Section } from "@/components/ui/card";
import { InputField, SelectField } from "@/components/ui/field";
import { requireOwner } from "@/lib/auth";
import { getStaff } from "@/lib/catalog";
import { getUsers } from "@/lib/users";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.users");
  return { title: t("title") };
}

export default async function UsersPage() {
  const me = await requireOwner();
  const [t, tc, users, staff] = await Promise.all([
    getTranslations("admin.users"),
    getTranslations("common"),
    getUsers(),
    getStaff(),
  ]);

  const roles = [
    { value: "owner", label: t("owner") },
    { value: "staff", label: t("staff") },
  ];
  const staffOptions = [
    { value: "", label: tc("none") },
    ...staff.map((member) => ({ value: member.id, label: member.name })),
  ];

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
        <Section title={t("title")} description={t("description")}>
          <ul className="space-y-3">
            {users.map((user) => (
              <li key={user.id} className="rounded-theme border border-border p-3">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {user.name}
                  {user.id === me.id ? <Badge>{t("you")}</Badge> : null}
                </p>
                <p className="mb-3 text-sm text-muted" dir="ltr">
                  {user.email}
                </p>
                <ActionForm action={updateUser} className="grid grid-cols-1 gap-3 space-y-0 sm:grid-cols-3 sm:items-end">
                  <input type="hidden" name="id" value={user.id} />
                  <SelectField
                    label={t("role")}
                    name="role"
                    defaultValue={user.role}
                    options={roles}
                    disabled={user.id === me.id}
                  />
                  <SelectField label={t("staffProfile")} name="staffId" defaultValue={user.staffId ?? ""} options={staffOptions} />
                  <InputField
                    label={t("newPassword")}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    dir="ltr"
                  />
                  <div className="flex gap-2 sm:col-span-3">
                    <SubmitButton variant="outline" size="sm">
                      {tc("save")}
                    </SubmitButton>
                  </div>
                </ActionForm>
                {user.id !== me.id ? (
                  <ActionForm action={deleteUser} className="mt-2 space-y-1">
                    <input type="hidden" name="id" value={user.id} />
                    <SubmitButton variant="ghost" size="sm" className="text-red-600" confirm={tc("confirmDelete")}>
                      {tc("delete")}
                    </SubmitButton>
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("add")}>
          <ActionForm action={createUser} resetOnSuccess>
            <InputField label={t("name")} name="name" required maxLength={80} />
            <InputField label={t("email")} name="email" type="email" required dir="ltr" autoComplete="off" />
            <InputField
              label={t("password")}
              name="password"
              type="password"
              required
              minLength={8}
              hint={t("passwordHint")}
              autoComplete="new-password"
              dir="ltr"
            />
            <SelectField label={t("role")} name="role" defaultValue="staff" options={roles} />
            <SelectField label={t("staffProfile")} name="staffId" options={staffOptions} />
            <SubmitButton>
              <Plus className="size-4" aria-hidden />
              {t("add")}
            </SubmitButton>
          </ActionForm>
        </Section>
      </div>
    </>
  );
}
