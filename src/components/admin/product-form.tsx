import { useTranslations } from "next-intl";
import { saveProduct } from "@/actions/products";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, InputField } from "@/components/ui/field";
import type { Product } from "@/db/schema";
import { moneyInputValue } from "@/lib/money";
import { BilingualFields } from "./bilingual-fields";

export function ProductForm({ product }: { product?: Product }) {
  const t = useTranslations("admin.products");
  const tc = useTranslations("common");
  return (
    <ActionForm action={saveProduct}>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <BilingualFields name="name" label={t("name")} defaults={{ en: product?.nameEn, ar: product?.nameAr }} />
      <BilingualFields
        name="description"
        label={t("description")}
        multiline
        maxLength={2000}
        defaults={{ en: product?.descriptionEn, ar: product?.descriptionAr }}
      />
      <InputField
        label={t("price")}
        name="price"
        inputMode="decimal"
        hint={t("priceHint")}
        defaultValue={moneyInputValue(product?.price)}
        className="max-w-48"
      />
      <div className="flex flex-wrap gap-6">
        <Checkbox name="isVisible" label={t("visible")} defaultChecked={product?.isVisible ?? true} />
        <Checkbox name="inStock" label={t("inStock")} defaultChecked={product?.inStock ?? true} />
      </div>
      <SubmitButton>{tc("save")}</SubmitButton>
    </ActionForm>
  );
}
