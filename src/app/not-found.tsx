import { House, SearchX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main className="page-glow flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="flex size-16 animate-scale-in items-center justify-center rounded-full bg-primary-soft text-primary">
        <SearchX className="size-7" aria-hidden />
      </span>
      <p className="animate-fade-up bg-linear-to-b from-primary to-primary/50 bg-clip-text text-7xl font-black text-transparent tabular-nums">
        404
      </p>
      <p className="max-w-xs animate-fade-up text-muted">{t("errors.notFound")}</p>
      <Link href="/" className={buttonClass("primary", "md", "animate-fade-up")}>
        <House className="size-4" aria-hidden />
        {t("common.back")}
      </Link>
    </main>
  );
}
