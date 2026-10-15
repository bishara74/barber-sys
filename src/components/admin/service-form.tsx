import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { saveService } from "@/actions/catalog";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, InputField, SelectField, Switch, SwitchList } from "@/components/ui/field";
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
    <ActionForm action={saveService} className="space-y-6">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      <FormGroup title={t("groupBasics")}>
        <SelectField
          label={t("type")}
          name="typeId"
          defaultValue={service?.typeId ?? typeId}
          options={types.map((type) => ({ value: type.id, label: type.name }))}
          className="max-w-sm"
        />
        <BilingualFields name="name" label={t("name")} defaults={{ en: service?.nameEn, ar: service?.nameAr }} />
        <BilingualFields
          name="description"
          label={t("description")}
          multiline
          maxLength={1000}
          defaults={{ en: service?.descriptionEn, ar: service?.descriptionAr }}
        />
      </FormGroup>

      <FormGroup title={t("groupPricing")}>
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
      </FormGroup>

      <FormGroup title={t("groupVisibility")}>
        <SwitchList>
          <Switch name="priceIsFrom" label={t("priceIsFrom")} hint={t("priceIsFromHint")} defaultChecked={service?.priceIsFrom ?? false} />
          <Switch
            name="bookableOnline"
            label={t("bookableOnline")}
            hint={t("bookableOnlineHint")}
            defaultChecked={service?.bookableOnline ?? true}
          />
          <Switch name="isVisible" label={t("visible")} hint={t("visibleHint")} defaultChecked={service?.isVisible ?? true} />
        </SwitchList>
      </FormGroup>

      {staff.length > 0 ? (
        <FormGroup title={t("staffWho")} hint={t("staffWhoHint")}>
          <div className="flex flex-wrap gap-2">
            {staff.map((member) => (
              <Checkbox
                key={member.id}
                name="staffIds"
                value={member.id}
                label={member.name}
                defaultChecked={assignedStaffIds.includes(member.id)}
                className="items-center rounded-full border border-border bg-card py-2 ps-2.5 pe-4 shadow-xs transition has-checked:border-primary has-checked:bg-primary-tint"
              />
            ))}
          </div>
        </FormGroup>
      ) : null}

      <SubmitButton>{tc("save")}</SubmitButton>
    </ActionForm>
  );
}

/** A titled group of fields inside a long form. */
export function FormGroup({ title, hint, children }: { title: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
