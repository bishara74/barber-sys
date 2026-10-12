"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/actions/public";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setLocale(locale === "ar" ? "en" : "ar"))}
      lang={locale === "ar" ? "en" : "ar"}
      className={cn("inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground disabled:opacity-50", className)}
    >
      <Languages className="size-4" aria-hidden />
      {locale === "ar" ? "English" : t("switchLanguage")}
    </button>
  );
}
