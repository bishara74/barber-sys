"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { createShopBooking } from "@/actions/bookings";
import { Price } from "@/components/public/price";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Field, InputField, SelectField, TextareaField } from "@/components/ui/field";
import type { ViewType } from "@/lib/catalog-view";
import { formatMoney } from "@/lib/money";

type ShopBookingFormProps = {
  types: ViewType[];
  staff: { id: number; name: string }[];
  defaultStart: string;
  defaultStaffId: number | null;
  walkIn: boolean;
  currency: string;
};

/** Add a phone booking or a walk-in. Shop bookings are confirmed right away. */
export function ShopBookingForm({ types, staff, defaultStart, defaultStaffId, walkIn, currency }: ShopBookingFormProps) {
  const t = useTranslations("admin.booking");
  const tc = useTranslations("common");
  const locale = useLocale();
  const services = types.flatMap((type) => type.services);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const service = services.find((item) => item.id === serviceId);

  const eligible = service ? staff.filter((member) => service.staffIds.includes(member.id)) : staff;
  const staffChoices = [...eligible, ...staff.filter((member) => !eligible.includes(member))];

  return (
    <ActionForm action={createShopBooking} className="max-w-xl">
      <input type="hidden" name="source" value={walkIn ? "walk_in" : "admin"} />

      <Field label={t("service")} name="serviceId">
        {({ id, invalid }) => (
          <select
            id={id}
            name="serviceId"
            required
            aria-invalid={invalid || undefined}
            value={serviceId ?? ""}
            onChange={(event) => setServiceId(Number(event.target.value) || null)}
            className="h-10 w-full rounded-theme border border-border bg-card px-3 text-sm"
          >
            <option value="" disabled>
              {t("selectService")}
            </option>
            {types.map((type) => (
              <optgroup key={type.id} label={type.name}>
                {type.services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {tc("minutes", { count: item.durationMin })}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </Field>

      {service ? (
        <p className="text-sm text-muted">
          <Price amount={service.price} isFrom={service.priceIsFrom} currency={currency} />
        </p>
      ) : null}

      {service?.groups.map((group) => (
        <fieldset key={`${service.id}-${group.id}`} className="space-y-2">
          <legend className="text-sm font-medium">{group.name}</legend>
          {group.options.map((option, index) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input
                type={group.selection === "single" ? "radio" : "checkbox"}
                name="optionIds"
                value={option.id}
                defaultChecked={group.isRequired && group.selection === "single" && index === 0}
                required={group.isRequired && group.selection === "single"}
                className="size-4 accent-[var(--primary)]"
              />
              {option.name}
              <span className="text-muted">
                {option.priceDelta ? ` +${formatMoney(option.priceDelta, currency, locale)}` : ""}
                {option.durationDelta ? ` +${tc("minutes", { count: option.durationDelta })}` : ""}
              </span>
            </label>
          ))}
        </fieldset>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label={t("staff")}
          name="staffId"
          defaultValue={defaultStaffId ?? undefined}
          options={staffChoices.map((member) => ({ value: member.id, label: member.name }))}
        />
        <InputField
          label={walkIn ? t("walkInNow") : t("startsAt")}
          name="startsAt"
          type="datetime-local"
          step={300}
          required
          defaultValue={defaultStart}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label={t("customerName")}
          name="name"
          required
          maxLength={80}
          defaultValue={walkIn ? t("walkInTitle") : ""}
          autoComplete="off"
        />
        <InputField
          label={t("customerPhone")}
          name="phone"
          type="tel"
          maxLength={30}
          dir="ltr"
          hint={walkIn ? t("phoneOptional") : undefined}
          required={!walkIn}
          autoComplete="off"
        />
      </div>

      <TextareaField label={t("customerNote")} name="note" rows={2} maxLength={500} />
      <SubmitButton>{t("create")}</SubmitButton>
    </ActionForm>
  );
}
