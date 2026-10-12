import { ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MoveButtons } from "@/components/admin/move-buttons";
import { Price } from "@/components/public/price";
import { buttonClass } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { localized } from "@/i18n/locales";
import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/config";
import { getAllProducts } from "@/lib/products";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.products");
  return { title: t("title") };
}

export default async function ProductsPage() {
  await requireOwner();
  const [locale, t, tc, settings, products] = await Promise.all([
    getLocale(),
    getTranslations("admin.products"),
    getTranslations("common"),
    getSettings(),
    getAllProducts(),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/admin/products/new" className={buttonClass("primary", "sm")}>
            <Plus className="size-4" aria-hidden />
            {t("add")}
          </Link>
        }
      />
      {products.length === 0 ? (
        <EmptyState>{t("noProducts")}</EmptyState>
      ) : (
        <Card className="p-2 sm:p-2">
          <ul className="divide-y divide-border">
            {products.map((product, index) => (
              <li key={product.id} className="flex items-center gap-3 p-2">
                <Link href={`/admin/products/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-theme bg-accent">
                    {product.images[0] ? (
                      <Image src={mediaUrl(product.images[0].key)} alt="" fill className="object-cover" sizes="56px" />
                    ) : (
                      <ImageIcon className="size-5 text-muted" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {localized(locale, product.nameEn, product.nameAr)}
                      {!product.isVisible ? <Badge>{tc("hidden")}</Badge> : null}
                      {!product.inStock ? <Badge>{t("outOfStock")}</Badge> : null}
                    </span>
                    <span className="text-sm text-muted">
                      <Price amount={product.price} currency={settings.currency} />
                    </span>
                  </span>
                </Link>
                <MoveButtons list="product" id={product.id} isFirst={index === 0} isLast={index === products.length - 1} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
