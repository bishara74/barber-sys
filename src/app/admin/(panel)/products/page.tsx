import { ImageIcon, Images, Plus, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MoveButtons } from "@/components/admin/move-buttons";
import { Price } from "@/components/public/price";
import { buttonClass } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/card";
import { RowLink, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const addButton = (
    <Link href="/admin/products/new" className={buttonClass("primary", "sm")}>
      <Plus className="size-4" aria-hidden />
      {t("add")}
    </Link>
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("pageHint")} actions={addButton} />
      {products.length === 0 ? (
        <EmptyState icon={ShoppingBag} action={addButton}>
          {t("noProducts")}
        </EmptyState>
      ) : (
        <Table>
          <TableHead>
            <TableHeader>{t("name")}</TableHeader>
            <TableHeader>{t("price")}</TableHeader>
            <TableHeader className="hidden sm:table-cell">{t("status")}</TableHeader>
            <TableHeader className="w-px">
              <span className="sr-only">{tc("moveUp")}</span>
            </TableHeader>
          </TableHead>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={product.id} href={`/admin/products/${product.id}`} muted={!product.isVisible}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-theme bg-accent ring-1 ring-border">
                      {product.images[0] ? (
                        <Image src={mediaUrl(product.images[0].key)} alt="" fill className="object-cover" sizes="48px" />
                      ) : (
                        <ImageIcon className="size-5 text-muted" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0">
                      <RowLink href={`/admin/products/${product.id}`} className="block truncate">
                        {localized(locale, product.nameEn, product.nameAr)}
                      </RowLink>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <Images className="size-3" aria-hidden />
                        {t("photoCount", { count: product.images.length })}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold whitespace-nowrap">
                  <Price amount={product.price} currency={settings.currency} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="flex flex-wrap gap-1.5">
                    {product.isVisible ? <Badge tone="success" dot>{t("shown")}</Badge> : <Badge dot>{tc("hidden")}</Badge>}
                    {!product.inStock ? <Badge tone="warning">{t("outOfStock")}</Badge> : null}
                  </span>
                </TableCell>
                <TableCell className="py-1.5">
                  <MoveButtons list="product" id={product.id} isFirst={index === 0} isLast={index === products.length - 1} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
