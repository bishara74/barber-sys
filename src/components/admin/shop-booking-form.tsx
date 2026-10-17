"use client";

import { CalendarPlus, Clock, Phone, Scissors, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { createShopBooking } from "@/actions/bookings";
import { Price } from "@/components/public/price";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Field, InputField, Select, SelectField, TextareaField } from "@/components/ui/field";
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
    <ActionForm action={createShopBooking} className="max-w-2xl space-y-5">
      <input type="hidden" name="source" value={walkIn ? "walk_in" : "admin"} />

      <FormCard icon={<Scissors />} title={t("service")}>
        <Field label={t("service")} name="serviceId">
          {({ id, invalid }) => (
            <Select
              id={id}
              name="serviceId"
              required
              aria-invalid={invalid || undefined}
              value={serviceId ?? ""}
              onChange={(event) => setServiceId(Number(event.target.value) || null)}
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
            </Select>
          )}
        </Field>

        {service ? (
          <p className="flex animate-fade-in flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-semibold text-primary">
              <Price amount={service.price} isFrom={service.priceIsFrom} currency={currency} />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-muted">
              <Clock className="size-3.5" aria-hidden />
              {tc("minutes", { count: service.durationMin })}
            </span>
          </p>
        ) : null}

        {service?.groups.map((group) => (
          <fieldset key={`${service.id}-${group.id}`} className="animate-fade-up space-y-2">
            <legend className="mb-2 text-sm font-medium">{group.name}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.options.map((option, index) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-3 rounded-theme border border-border bg-card px-3 py-2.5 text-sm shadow-xs transition hover:border-primary/40 has-checked:border-primary has-checked:bg-primary-tint"
                >
                  <input
                    type={group.selection === "single" ? "radio" : "checkbox"}
                    name="optionIds"
                    value={option.id}
                    defaultChecked={group.isRequired && group.selection === "single" && index === 0}
                    required={group.isRequired && group.selection === "single"}
                    className="size-4 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="min-w-0 flex-1 font-medium">{option.name}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {option.priceDelta ? ` +${formatMoney(option.priceDelta, currency, locale)}` : ""}
                    {option.durationDelta ? ` +${tc("minutes", { count: option.durationDelta })}` : ""}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </FormCard>

      <FormCard icon={<CalendarPlus />} title={t("when")}>
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
      </FormCard>

      <FormCard icon={<UserRound />} title={t("customer")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label={t("customerName")}
            name="name"
            required
            maxLength={80}
            defaultValue={walkIn ? t("walkInTitle") : ""}
            autoComplete="off"
            icon={<UserRound />}
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
            icon={<Phone />}
          />
        </div>
        <TextareaField label={t("customerNote")} name="note" rows={2} maxLength={500} />
      </FormCard>

      <SubmitButton size="lg" className="w-full sm:w-auto">
        <CalendarPlus className="size-4" aria-hidden />
        {t("create")}
      </SubmitButton>
    </ActionForm>
  );
}

function FormCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-theme border border-border bg-card p-4 shadow-soft sm:p-5">
      <h2 className="flex items-center gap-2.5 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-theme bg-primary-soft text-primary [&>svg]:size-4" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}
