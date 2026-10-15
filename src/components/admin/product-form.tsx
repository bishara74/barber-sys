import { useTranslations } from "next-intl";
import { saveProduct } from "@/actions/products";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { InputField, Switch, SwitchList } from "@/components/ui/field";
import type { Product } from "@/db/schema";
import { moneyInputValue } from "@/lib/money";
import { BilingualFields } from "./bilingual-fields";

export function ProductForm({ product }: { product?: Product }) {
  const t = useTranslations("admin.products");
  const tc = useTranslations("common");
  return (
    <ActionForm action={saveProduct} className="space-y-5">
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
        className="max-w-56"
      />
      <SwitchList>
        <Switch name="isVisible" label={t("visible")} defaultChecked={product?.isVisible ?? true} />
        <Switch name="inStock" label={t("inStock")} hint={t("inStockHint")} defaultChecked={product?.inStock ?? true} />
      </SwitchList>
      <SubmitButton>{tc("save")}</SubmitButton>
    </ActionForm>
  );
}
