import { useTranslations } from "next-intl";
import { saveService } from "@/actions/catalog";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, InputField, SelectField } from "@/components/ui/field";
import type { Service } from "@/db/schema";
import { moneyInputValue } from "@/lib/money";
import { BilingualFields } from "./bilingual-fields";

type ServiceFormProps = {
  service?: Service;
  typeId?: number;
  types: { id: number; name: string }[];
  staff: { id: number; name: string }[];
  assignedStaffIds: number[];
};

export function ServiceForm({ service, typeId, types, staff, assignedStaffIds }: ServiceFormProps) {
  const t = useTranslations("admin.services");
  const tc = useTranslations("common");

  return (
    <ActionForm action={saveService}>
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <SelectField
        label={t("type")}
        name="typeId"
        defaultValue={service?.typeId ?? typeId}
        options={types.map((type) => ({ value: type.id, label: type.name }))}
      />
      <BilingualFields name="name" label={t("name")} defaults={{ en: service?.nameEn, ar: service?.nameAr }} />
      <BilingualFields
        name="description"
        label={t("description")}
        multiline
        maxLength={1000}
        defaults={{ en: service?.descriptionEn, ar: service?.descriptionAr }}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputField
          label={t("price")}
          name="price"
          inputMode="decimal"
          hint={t("priceHint")}
          defaultValue={moneyInputValue(service?.price)}
        />
        <InputField
          label={t("duration")}
          name="durationMin"
          type="number"
          min={5}
          step={5}
          required
          defaultValue={service?.durationMin ?? 30}
        />
        <InputField
          label={t("buffer")}
          name="bufferMin"
          type="number"
          min={0}
          step={5}
          hint={t("bufferHint")}
          defaultValue={service?.bufferMin ?? 0}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Checkbox name="priceIsFrom" label={t("priceIsFrom")} defaultChecked={service?.priceIsFrom ?? false} />
        <Checkbox
          name="bookableOnline"
          label={t("bookableOnline")}
          hint={t("bookableOnlineHint")}
          defaultChecked={service?.bookableOnline ?? true}
        />
        <Checkbox name="isVisible" label={t("visible")} defaultChecked={service?.isVisible ?? true} />
      </div>
      {staff.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("staffWho")}</legend>
          <p className="text-xs text-muted">{t("staffWhoHint")}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {staff.map((member) => (
              <Checkbox
                key={member.id}
                name="staffIds"
                value={member.id}
                label={member.name}
                defaultChecked={assignedStaffIds.includes(member.id)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
      <SubmitButton>{tc("save")}</SubmitButton>
    </ActionForm>
  );
}
