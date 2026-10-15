import { ChevronDown, KeyRound, Mail, Plus, ShieldCheck, Trash2, UserPlus, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createUser, deleteUser, updateUser } from "@/actions/users";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Avatar, Badge, PageHeader, Section } from "@/components/ui/card";
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
  const [t, tc, tn, users, staff] = await Promise.all([
    getTranslations("admin.users"),
    getTranslations("common"),
    getTranslations("admin.nav"),
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
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title={t("title")} icon={ShieldCheck} description={t("editHint")} className="lg:self-start">
          <ul className="-mx-1 divide-y divide-border">
            {users.map((user) => {
              const linked = staff.find((member) => member.id === user.staffId);
              return (
                <li key={user.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-theme px-1 py-3 transition hover:bg-primary-tint [&::-webkit-details-marker]:hidden">
                      <Avatar name={user.name} className="size-10 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 font-medium">
                          {user.name}
                          {user.id === me.id ? <Badge tone="primary">{t("you")}</Badge> : null}
                        </span>
                        <span className="block truncate text-sm text-muted" dir="ltr">
                          {user.email}
                        </span>
                      </span>
                      <span className="hidden flex-col items-end gap-1 sm:flex">
                        <Badge tone={user.role === "owner" ? "warning" : "info"}>
                          {user.role === "owner" ? tn("roleOwner") : tn("roleStaff")}
                        </Badge>
                        {linked ? <span className="text-xs text-muted">{linked.name}</span> : null}
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="animate-fade-in space-y-3 px-1 pt-1 pb-4">
                      <ActionForm action={updateUser} className="grid grid-cols-1 gap-3 space-y-0 sm:grid-cols-3 sm:items-start">
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
                          placeholder={t("keepPassword")}
                          dir="ltr"
                        />
                        <div className="flex gap-2 sm:col-span-3">
                          <SubmitButton variant="outline" size="sm">
                            {tc("save")}
                          </SubmitButton>
                        </div>
                      </ActionForm>
                      {user.id !== me.id ? (
                        <ActionForm action={deleteUser} className="space-y-1">
                          <input type="hidden" name="id" value={user.id} />
                          <SubmitButton variant="danger-ghost" size="sm" confirm={tc("confirmDelete")}>
                            <Trash2 className="size-4" aria-hidden />
                            {tc("delete")}
                          </SubmitButton>
                        </ActionForm>
                      ) : null}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title={t("add")} icon={UserPlus} className="lg:self-start">
          <ActionForm action={createUser} resetOnSuccess>
            <InputField label={t("name")} name="name" required maxLength={80} icon={<UserRound />} />
            <InputField label={t("email")} name="email" type="email" required dir="ltr" autoComplete="off" icon={<Mail />} />
            <InputField
              label={t("password")}
              name="password"
              type="password"
              required
              minLength={8}
              hint={t("passwordHint")}
              autoComplete="new-password"
              dir="ltr"
              icon={<KeyRound />}
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
