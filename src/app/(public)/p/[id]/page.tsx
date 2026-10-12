import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Price } from "@/components/public/price";
import { buttonClass } from "@/components/ui/button";
import { localized } from "@/i18n/locales";
import { getProfile, getSettings } from "@/lib/config";
import { whatsappLink } from "@/lib/phone";
import { getProduct } from "@/lib/products";
import { mediaUrl } from "@/lib/utils";

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
    <main className="mx-auto min-h-screen max-w-lg pb-12">
      <div className="flex snap-x snap-mandatory overflow-x-auto bg-accent">
        {product.images.length > 0 ? (
          product.images.map((image, index) => (
            <div key={image.id} className="relative aspect-square w-full shrink-0 snap-center">
              <Image src={mediaUrl(image.key)} alt={name} fill priority={index === 0} className="object-cover" sizes="512px" />
            </div>
          ))
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </div>

      <div className="space-y-4 px-4 pt-5">
        <Link href="/#products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <Back className="size-4" aria-hidden />
          {t("allProducts")}
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="mt-1 text-lg font-medium text-primary">
            {product.inStock ? <Price amount={product.price} currency={settings.currency} /> : t("outOfStock")}
          </p>
        </div>
        {description ? <p className="whitespace-pre-line leading-relaxed">{description}</p> : null}
        {profile.whatsapp ? (
          <a
            href={whatsappLink(profile.whatsapp, t("productMessage", { name }))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("primary", "lg", "w-full")}
          >
            <MessageCircle className="size-5" aria-hidden />
            {t("askOnWhatsApp")}
          </a>
        ) : null}
      </div>
    </main>
  );
}
