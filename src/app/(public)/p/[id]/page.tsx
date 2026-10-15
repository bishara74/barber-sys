import { ArrowLeft, ArrowRight, MessageCircle, PackageCheck, PackageX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Price } from "@/components/public/price";
import { ProductGallery } from "@/components/public/product-gallery";
import { buttonClass } from "@/components/ui/button";
import { localized } from "@/i18n/locales";
import { getProfile, getSettings } from "@/lib/config";
import { whatsappLink } from "@/lib/phone";
import { getProduct } from "@/lib/products";
import { cn, mediaUrl, stagger } from "@/lib/utils";

async function loadProduct(params: PageProps<"/p/[id]">["params"]) {
  const id = Number((await params).id);
  const product = Number.isInteger(id) ? await getProduct(id) : undefined;
  if (!product?.isVisible) notFound();
  return product;
}

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const [product, locale] = await Promise.all([loadProduct(params), getLocale()]);
  return {
    title: localized(locale, product.nameEn, product.nameAr),
    openGraph: { images: product.images[0] ? [mediaUrl(product.images[0].key)] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/p/[id]">) {
  const [product, locale, t, profile, settings] = await Promise.all([
    loadProduct(params),
    getLocale(),
    getTranslations("home"),
    getProfile(),
    getSettings(),
  ]);
  const name = localized(locale, product.nameEn, product.nameAr);
  const description = localized(locale, product.descriptionEn, product.descriptionAr);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <main className="page-glow min-h-screen pb-28">
      <div className="relative mx-auto max-w-xl overflow-hidden sm:mt-6 sm:rounded-theme">
        <ProductGallery images={product.images.map((image) => mediaUrl(image.key))} alt={name} />
        <Link
          href="/#products"
          aria-label={t("allProducts")}
          className="absolute start-3 top-3 flex size-10 items-center justify-center rounded-full bg-background/80 shadow-soft backdrop-blur-md transition hover:bg-background"
        >
          <Back className="size-[18px]" />
        </Link>
      </div>

      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <div className="animate-fade-up space-y-2">
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {product.inStock ? (
              <p className="text-xl font-bold text-primary">
                <Price amount={product.price} currency={settings.currency} />
              </p>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                product.inStock
                  ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                  : "bg-accent text-muted",
              )}
            >
              {product.inStock ? <PackageCheck className="size-3.5" aria-hidden /> : <PackageX className="size-3.5" aria-hidden />}
              {product.inStock ? t("inStock") : t("outOfStock")}
            </span>
          </div>
        </div>
        {description ? (
          <p className="animate-fade-up whitespace-pre-line leading-relaxed text-foreground/85" style={stagger(1)}>
            {description}
          </p>
        ) : null}
        <Link href="/#products" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <Back className="size-4" aria-hidden />
          {t("allProducts")}
        </Link>
      </div>

      {profile.whatsapp ? (
        <div className="fixed inset-x-0 bottom-0 z-20 animate-slide-up border-t border-border bg-background/90 backdrop-blur-lg">
          <div className="mx-auto max-w-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <a
              href={whatsappLink(profile.whatsapp, t("productMessage", { name }))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "lg", "w-full")}
            >
              <MessageCircle className="size-5" aria-hidden />
              {t("askOnWhatsApp")}
            </a>
          </div>
        </div>
      ) : null}
    </main>
  );
}
