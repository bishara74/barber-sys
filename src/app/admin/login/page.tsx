import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { login } from "@/actions/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { TurnstileField } from "@/components/turnstile-field";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/field";
import { getCurrentUser } from "@/lib/auth";
import { getDeploymentConfig } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.login");
  return { title: t("title"), robots: { index: false } };
}

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const t = await getTranslations("admin.login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-5 text-xl font-semibold">{t("title")}</h1>
        <ActionForm action={login}>
          <InputField label={t("email")} name="email" type="email" autoComplete="email" required dir="ltr" />
          <InputField
            label={t("password")}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
          />
          <TurnstileField siteKey={getDeploymentConfig().turnstileSiteKey} />
          <SubmitButton className="w-full">{t("submit")}</SubmitButton>
        </ActionForm>
      </Card>
      <LocaleSwitcher />
    </main>
  );
}
