"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/actions/public";
import { cn } from "@/lib/utils";

type LocaleSwitcherProps = {
  className?: string;
  /** "glass" is a frosted pill for use over photos. */
  variant?: "plain" | "pill" | "glass";
};

export function LocaleSwitcher({ className, variant = "pill" }: LocaleSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setLocale(locale === "ar" ? "en" : "ar"))}
      lang={locale === "ar" ? "en" : "ar"}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-50",
        variant === "plain" && "text-muted hover:text-foreground",
        variant === "pill" &&
          "rounded-full border border-border bg-card px-3.5 py-1.5 text-muted shadow-xs hover:border-primary/40 hover:text-foreground",
        variant === "glass" &&
          "rounded-full bg-background/75 px-3.5 py-1.5 text-foreground shadow-soft backdrop-blur-md hover:bg-background/90",
        className,
      )}
    >
      <Languages className={cn("size-4", pending && "animate-pulse")} aria-hidden />
      {locale === "ar" ? "English" : t("switchLanguage")}
    </button>
  );
}
