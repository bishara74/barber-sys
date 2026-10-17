import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";

type PriceProps = { amount: number | null; isFrom?: boolean; currency: string };

/** A price, "from" price, "free" or "price on request". Works in server and client components. */
export function Price({ amount, isFrom, currency }: PriceProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  if (amount === null) return <>{t("priceOnRequest")}</>;
  if (amount === 0 && !isFrom) return <>{t("free")}</>;
  const formatted = formatMoney(amount, currency, locale);
  return <>{isFrom ? t("priceFrom", { price: formatted }) : formatted}</>;
}
