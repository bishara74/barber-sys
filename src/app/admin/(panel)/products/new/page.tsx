import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
      <PageHeader title={t("newProduct")} />
      <Section title={t("newProduct")}>
        <ProductForm />
      </Section>
    </>
  );
}
