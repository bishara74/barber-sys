import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { changePassword, logout } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { PageHeader, Section } from "@/components/ui/card";
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
      <div className="grid grid-cols-1 max-w-3xl gap-5 md:grid-cols-2">
        <Section title={user.name} description={user.email}>
          <form action={logout}>
            <SubmitButton variant="outline">{tn("logout")}</SubmitButton>
          </form>
        </Section>
        <Section title={t("changePassword")}>
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
