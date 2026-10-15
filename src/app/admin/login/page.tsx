import { ArrowLeft, ArrowRight, Lock, LogIn, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { login } from "@/actions/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ShopMark } from "@/components/shop-mark";
import { TurnstileField } from "@/components/turnstile-field";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/field";
import { localized } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.login");
  return { title: t("title"), robots: { index: false } };
}

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const [t, locale, profile] = await Promise.all([getTranslations("admin.login"), getLocale(), getProfile()]);
  const shopName = localized(locale, profile.nameEn, profile.nameAr);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="hero-fallback absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
        aria-hidden
      />
      <div className="absolute end-4 top-4">
        <LocaleSwitcher variant="glass" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <ShopMark
            name={shopName || "•"}
            logoKey={profile.avatarKey}
            sizes="72px"
            className="size-18 animate-scale-in text-3xl shadow-lift ring-4 ring-background"
          />
          <h1 className="mt-4 animate-fade-up text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 animate-fade-up text-sm text-muted">{shopName || t("subtitle")}</p>
        </div>

        <Card className="animate-fade-up p-6 shadow-lift sm:p-7">
          <p className="mb-5 text-sm text-muted">{t("subtitle")}</p>
          <ActionForm action={login}>
            <InputField label={t("email")} name="email" type="email" autoComplete="email" required dir="ltr" icon={<Mail />} />
            <InputField
              label={t("password")}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              icon={<Lock />}
            />
            <TurnstileField siteKey={getDeploymentConfig().turnstileSiteKey} />
            <SubmitButton size="lg" className="w-full">
              <LogIn className="size-4" aria-hidden />
              {t("submit")}
            </SubmitButton>
          </ActionForm>
        </Card>

        <Link
          href="/"
          className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition hover:text-primary"
        >
          <Back className="size-4" aria-hidden />
          {t("backToSite")}
        </Link>
      </div>
    </main>
  );
}
