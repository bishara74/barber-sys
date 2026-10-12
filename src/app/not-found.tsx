import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="text-muted">{t("errors.notFound")}</p>
      <Link href="/" className={buttonClass("primary")}>
        {t("common.back")}
      </Link>
    </main>
  );
}
