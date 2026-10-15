"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 animate-scale-in items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <p className="max-w-xs animate-fade-up text-muted">{t("generic")}</p>
      <Button onClick={reset} className="animate-fade-up">
        <RotateCcw className="size-4" aria-hidden />
        {t("tryAgain")}
      </Button>
    </main>
  );
}
