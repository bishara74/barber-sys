import { CalendarCheck, Clock3, Globe2, Hourglass, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { saveSettings } from "@/actions/settings";
import { ActionForm, StickySave, SubmitButton } from "@/components/ui/action-form";
import { PageHeader, Section } from "@/components/ui/card";
import { InputField, RadioCards, SelectField, Switch, SwitchList } from "@/components/ui/field";
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
      inputMode="numeric"
      min={min}
      max={max}
      required
      hint={hint}
      defaultValue={String(settings[name])}
    />
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("pageHint")} />
      <ActionForm action={saveSettings} showMessage={false} className="max-w-4xl space-y-5">
        <Section title={t("booking")} icon={CalendarCheck}>
          <RadioCards
            name="bookingMode"
            legend={t("bookingMode")}
            defaultValue={settings.bookingMode}
            options={[
              { value: "approval", label: t("modeApproval"), hint: t("modeApprovalHint"), icon: <ShieldCheck /> },
              { value: "instant", label: t("modeInstant"), hint: t("modeInstantHint"), icon: <Zap /> },
            ]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {number("pendingExpiryHours", 1, 168, t("pendingExpiryHint"))}
          </div>
          <SwitchList>
            <Switch
              name="allowStaffChoice"
              label={t("allowStaffChoice")}
              hint={t("allowStaffChoiceHint")}
              defaultChecked={settings.allowStaffChoice}
            />
          </SwitchList>
        </Section>

        <Section title={t("slots")} icon={Clock3}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField
              label={t("slotMode")}
              name="slotMode"
              defaultValue={settings.slotMode}
              options={[
                { value: "service", label: t("slotModeService") },
                { value: "fixed", label: t("slotModeFixed") },
              ]}
            />
            {number("fixedSlotMin", 5, 240, t("fixedSlotHint"))}
            <SelectField
              label={t("slotStepMin")}
              name="slotStepMin"
              defaultValue={settings.slotStepMin}
              options={SLOT_STEPS.map((step) => ({ value: step, label: tc("minutes", { count: step }) }))}
            />
          </div>
        </Section>

        <Section title={t("limits")} icon={Hourglass}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {number("minNoticeMin", 0, 10080, t("minNoticeHint"))}
            {number("maxDaysAhead", 1, 365)}
            {number("cancelWindowHours", 0, 168)}
            {number("maxActiveBookingsPerPhone", 1, 20)}
          </div>
        </Section>

        <Section title={t("regional")} icon={Globe2}>
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
              className="[&_input]:uppercase"
            />
          </div>
        </Section>

        <StickySave>
          <SubmitButton>{tc("save")}</SubmitButton>
        </StickySave>
      </ActionForm>
    </>
  );
}
