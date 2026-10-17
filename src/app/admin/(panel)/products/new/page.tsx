import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { BackLink } from "@/components/admin/back-link";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader, Section } from "@/components/ui/card";
import { requireOwner } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.products");
  return { title: t("newProduct") };
}

export default async function NewProductPage() {
  await requireOwner();
  const t = await getTranslations("admin.products");
  return (
    <>
      <PageHeader back={<BackLink href="/admin/products" label={t("title")} />} title={t("newProduct")} />
      <Section title={t("newProduct")} icon={Plus} description={t("photosAfterSave")} className="max-w-3xl">
        <ProductForm />
      </Section>
    </>
  );
}
