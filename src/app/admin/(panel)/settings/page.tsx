import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { saveSettings } from "@/actions/settings";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { PageHeader, Section } from "@/components/ui/card";
import { Checkbox, InputField, SelectField } from "@/components/ui/field";
import { requireOwner } from "@/lib/auth";
import { getSettings, SLOT_STEPS } from "@/lib/config";

type NumberSetting =
  | "pendingExpiryHours"
  | "fixedSlotMin"
  | "minNoticeMin"
  | "maxDaysAhead"
  | "cancelWindowHours"
  | "maxActiveBookingsPerPhone";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  await requireOwner();
  const [t, tc, settings] = await Promise.all([
    getTranslations("admin.settings"),
    getTranslations("common"),
    getSettings(),
  ]);

  const number = (name: NumberSetting, min: number, max: number, hint?: string) => (
    <InputField
      label={t(name)}
      name={name}
      type="number"
      min={min}
      max={max}
      required
      hint={hint}
      defaultValue={String(settings[name])}
    />
  );

  return (
    <>
      <PageHeader title={t("title")} />
      <ActionForm action={saveSettings} className="space-y-5">
        <Section title={t("booking")}>
          <SelectField
            label={t("bookingMode")}
            name="bookingMode"
            defaultValue={settings.bookingMode}
            options={[
              { value: "approval", label: t("modeApproval") },
              { value: "instant", label: t("modeInstant") },
            ]}
          />
          {number("pendingExpiryHours", 1, 168, t("pendingExpiryHint"))}
          <Checkbox name="allowStaffChoice" label={t("allowStaffChoice")} defaultChecked={settings.allowStaffChoice} />
        </Section>

        <Section title={t("slots")}>
          <SelectField
            label={t("slotMode")}
            name="slotMode"
            defaultValue={settings.slotMode}
            options={[
              { value: "service", label: t("slotModeService") },
              { value: "fixed", label: t("slotModeFixed") },
            ]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {number("fixedSlotMin", 5, 240)}
            <SelectField
              label={t("slotStepMin")}
              name="slotStepMin"
              defaultValue={settings.slotStepMin}
              options={SLOT_STEPS.map((step) => ({ value: step, label: tc("minutes", { count: step }) }))}
            />
          </div>
        </Section>

        <Section title={t("limits")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {number("minNoticeMin", 0, 10080)}
            {number("maxDaysAhead", 1, 365)}
            {number("cancelWindowHours", 0, 168)}
            {number("maxActiveBookingsPerPhone", 1, 20)}
          </div>
        </Section>

        <Section title={t("regional")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label={t("phoneCountryCode")}
              name="phoneCountryCode"
              inputMode="numeric"
              required
              dir="ltr"
              hint={t("phoneCountryCodeHint")}
              defaultValue={settings.phoneCountryCode}
            />
            <InputField
              label={t("currency")}
              name="currency"
              required
              maxLength={3}
              dir="ltr"
              hint={t("currencyHint")}
              defaultValue={settings.currency}
            />
          </div>
        </Section>

        <SubmitButton>{tc("save")}</SubmitButton>
      </ActionForm>
    </>
  );
}
