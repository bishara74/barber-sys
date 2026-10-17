import { useTranslations } from "next-intl";
import { InputField, TextareaField } from "@/components/ui/field";

type BilingualFieldsProps = {
  /** Field name prefix: "name" gives "nameEn" and "nameAr". */
  name: string;
  label: string;
  defaults?: { en?: string; ar?: string };
  multiline?: boolean;
  maxLength?: number;
};

/** English and Arabic inputs side by side for content shown on the public page. */
export function BilingualFields({ name, label, defaults, multiline, maxLength = 120 }: BilingualFieldsProps) {
  const t = useTranslations("common");
  const Control = multiline ? TextareaField : InputField;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Control
        label={`${label} (${t("english")})`}
        name={`${name}En`}
        defaultValue={defaults?.en}
        maxLength={maxLength}
        dir="ltr"
        lang="en"
      />
      <Control
        label={`${label} (${t("arabic")})`}
        name={`${name}Ar`}
        defaultValue={defaults?.ar}
        maxLength={maxLength}
        dir="rtl"
        lang="ar"
      />
    </div>
  );
}
