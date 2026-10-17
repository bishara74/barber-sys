import { ImageIcon, Images, Pencil, Trash2, Upload } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { addProductImages, deleteProduct, deleteProductImage } from "@/actions/products";
import { BackLink } from "@/components/admin/back-link";
import { MoveButtons } from "@/components/admin/move-buttons";
import { ProductForm } from "@/components/admin/product-form";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { EmptyState, PageHeader, Section } from "@/components/ui/card";
import { ImageInput } from "@/components/ui/image-input";
import { localized } from "@/i18n/locales";
import { requireOwner } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.products");
  return { title: t("editProduct") };
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireOwner();
  const product = await getProduct(Number((await params).id));
  if (!product) notFound();

  const [locale, t, tc] = await Promise.all([
    getLocale(),
    getTranslations("admin.products"),
    getTranslations("common"),
  ]);

  return (
    <>
      <PageHeader
        back={<BackLink href="/admin/products" label={t("title")} />}
        title={localized(locale, product.nameEn, product.nameAr)}
        actions={
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <SubmitButton variant="danger-ghost" size="sm" confirm={tc("confirmDelete")}>
              <Trash2 className="size-4" aria-hidden />
              {tc("delete")}
            </SubmitButton>
          </form>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={t("editProduct")} icon={Pencil}>
          <ProductForm product={product} />
        </Section>

        <Section title={t("images")} icon={Images} description={t("imagesHint")}>
          {product.images.length === 0 ? (
            <EmptyState icon={ImageIcon}>{t("noImages")}</EmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {product.images.map((image, index) => (
                <li key={image.id} className="group overflow-hidden rounded-theme border border-border bg-card shadow-xs">
                  <div className="relative aspect-square overflow-hidden bg-accent">
                    <Image
                      src={mediaUrl(image.key)}
                      alt=""
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="200px"
                    />
                    {index === 0 ? (
                      <span className="absolute start-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-soft">
                        {t("cover")}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <MoveButtons
                      list="productImage"
                      id={image.id}
                      isFirst={index === 0}
                      isLast={index === product.images.length - 1}
                    />
                    <form action={deleteProductImage}>
                      <input type="hidden" name="id" value={image.id} />
                      <SubmitButton variant="danger-ghost" size="icon-sm" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
                        <Trash2 className="size-4" />
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ActionForm action={addProductImages} resetOnSuccess className="border-t border-border pt-4">
            <input type="hidden" name="productId" value={product.id} />
            <ImageInput name="images" label={t("addImages")} multiple />
            <SubmitButton variant="secondary">
              <Upload className="size-4" aria-hidden />
              {t("uploadImages")}
            </SubmitButton>
          </ActionForm>
        </Section>
      </div>
    </>
  );
}
