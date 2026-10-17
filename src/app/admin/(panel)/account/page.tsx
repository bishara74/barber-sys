import { KeyRound, LogOut, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { changePassword, logout } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Avatar, Badge, PageHeader, Section } from "@/components/ui/card";
import { InputField } from "@/components/ui/field";
import { requireUser } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.account");
  return { title: t("title") };
}

export default async function AccountPage() {
  const user = await requireUser();
  const [t, tn] = await Promise.all([getTranslations("admin.account"), getTranslations("admin.nav")]);

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
        <Section title={t("profile")} icon={UserRound} className="md:self-start">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} className="size-16 text-xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted" dir="ltr">
                {user.email}
              </p>
              <Badge tone={user.role === "owner" ? "warning" : "info"} className="mt-1.5">
                {user.role === "owner" ? tn("roleOwner") : tn("roleStaff")}
              </Badge>
            </div>
          </div>
          <form action={logout} className="border-t border-border pt-4">
            <SubmitButton variant="danger-ghost">
              <LogOut className="size-4" aria-hidden />
              {tn("logout")}
            </SubmitButton>
          </form>
        </Section>
        <Section title={t("changePassword")} icon={KeyRound} description={t("passwordHint")}>
          <ActionForm action={changePassword} resetOnSuccess>
            <InputField
              label={t("currentPassword")}
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
            />
            <InputField
              label={t("newPassword")}
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              dir="ltr"
            />
            <SubmitButton>{t("changePassword")}</SubmitButton>
          </ActionForm>
        </Section>
      </div>
    </>
  );
}
