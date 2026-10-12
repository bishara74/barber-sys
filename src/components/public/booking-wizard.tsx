"use client";

import { ArrowLeft, ArrowRight, Check, Clock, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { createBooking } from "@/actions/public";
import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import type { ViewGroup, ViewService, ViewType } from "@/lib/catalog-view";
import { formatMoney } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Price } from "./price";
import { SlotPicker, type BookingDay } from "./slot-picker";

export type WizardStaff = { id: number; name: string; avatarUrl: string | null };

type Step = "service" | "options" | "staff" | "time" | "details";

type BookingWizardProps = {
  types: ViewType[];
  staff: WizardStaff[];
  allowStaffChoice: boolean;
  approvalMode: boolean;
  currency: string;
  timeZone: string;
  turnstileSiteKey: string;
  days: BookingDay[];
  initialServiceId: number | null;
};

const CONTACT_KEY = "booking-contact";

/** The wizard steps for a service: options and staff are skipped when there is nothing to choose. */
function stepsFor(service: ViewService | null, staff: WizardStaff[], allowStaffChoice: boolean): Step[] {
  const eligible = service ? staff.filter((member) => service.staffIds.includes(member.id)) : [];
  return [
    "service",
    ...(service && service.groups.length > 0 ? (["options"] as const) : []),
    ...(allowStaffChoice && eligible.length > 1 ? (["staff"] as const) : []),
    "time",
    "details",
  ];
}

/** Required single-choice groups start with their first option picked. */
function defaultOptions(service: ViewService): number[] {
  return service.groups
    .filter((group) => group.isRequired && group.selection === "single" && group.options.length > 0)
    .map((group) => group.options[0].id);
}

export function BookingWizard(props: BookingWizardProps) {
  const { types, staff, allowStaffChoice, currency, timeZone } = props;
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale();

  const services = types.flatMap((type) => type.services);
  const initial = services.find((service) => service.id === props.initialServiceId) ?? null;

  const [serviceId, setServiceId] = useState<number | null>(initial?.id ?? null);
  const [optionIds, setOptionIds] = useState<number[]>(initial ? defaultOptions(initial) : []);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [step, setStep] = useState<Step>(() =>
    initial ? stepsFor(initial, staff, allowStaffChoice)[1] : "service",
  );

  const service = services.find((candidate) => candidate.id === serviceId) ?? null;
  const eligibleStaff = service ? staff.filter((member) => service.staffIds.includes(member.id)) : [];
  const steps = stepsFor(service, staff, allowStaffChoice);
  const stepIndex = steps.indexOf(step);
  const stepLabels: Record<Step, string> = {
    service: t("stepService"),
    options: t("stepOptions"),
    staff: t("stepStaff"),
    time: t("stepTime"),
    details: t("stepDetails"),
  };

  const chosenOptions = service
    ? service.groups.flatMap((group) => group.options).filter((option) => optionIds.includes(option.id))
    : [];
  const totalPrice =
    service && service.price !== null
      ? service.price + chosenOptions.reduce((sum, option) => sum + option.priceDelta, 0)
      : null;
  const totalDuration = service
    ? service.durationMin + chosenOptions.reduce((sum, option) => sum + option.durationDelta, 0)
    : 0;
  const optionsValid = service
    ? service.groups.every(
        (group) => !group.isRequired || group.options.some((option) => optionIds.includes(option.id)),
      )
    : false;

  const slotQuery = new URLSearchParams({
    service: String(serviceId ?? ""),
    options: optionIds.join(","),
    ...(staffId ? { staff: String(staffId) } : {}),
  }).toString();

  const goNext = () => setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  const goBack = () => setStep(steps[Math.max(stepIndex - 1, 0)]);

  function chooseService(next: ViewService) {
    setServiceId(next.id);
    setOptionIds(defaultOptions(next));
    setStaffId(null);
    setStartsAt(null);
    setStep(stepsFor(next, staff, allowStaffChoice)[1]);
  }

  function toggleOption(group: ViewGroup, optionId: number) {
    setStartsAt(null);
    setOptionIds((current) => {
      const groupIds = group.options.map((option) => option.id);
      if (group.selection === "single") {
        const others = current.filter((id) => !groupIds.includes(id));
        return current.includes(optionId) && !group.isRequired ? others : [...others, optionId];
      }
      return current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
    });
  }

  if (services.length === 0) {
    return <p className="py-12 text-center text-muted">{t("nothingToBook")}</p>;
  }

  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const selectedStaff = staff.find((member) => member.id === staffId);
  const canContinue =
    (step === "options" && optionsValid) || step === "staff" || (step === "time" && startsAt !== null);

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {stepIndex > 0 ? (
            <button type="button" onClick={goBack} className="rounded-full p-1 hover:bg-accent" aria-label={tc("back")}>
              <Back className="size-5" />
            </button>
          ) : (
            <Link href="/" className="rounded-full p-1 hover:bg-accent" aria-label={tc("back")}>
              <Back className="size-5" />
            </Link>
          )}
          <h1 className="font-semibold">{t("title")}</h1>
        </div>
        <ol className="mt-3 flex gap-1.5">
          {steps.map((name, index) => (
            <li key={name} className="flex-1">
              <button
                type="button"
                disabled={index >= stepIndex}
                onClick={() => setStep(name)}
                className="block w-full text-start"
              >
                <span className={cn("block h-1 rounded-full", index <= stepIndex ? "bg-primary" : "bg-border")} />
                <span className={cn("mt-1 block text-[11px]", index === stepIndex ? "text-foreground" : "text-muted")}>
                  {stepLabels[name]}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="pt-5">
        {step === "service" ? <StepTitle>{t("chooseService")}</StepTitle> : null}
        {step === "service"
          ? types.map((type) => (
              <section key={type.id} className="mb-6">
                {types.length > 1 ? <h3 className="mb-2 text-sm font-semibold text-muted">{type.name}</h3> : null}
                <div className="space-y-2">
                  {type.services.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseService(item)}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-theme border bg-card p-4 text-start transition hover:border-primary",
                        item.id === serviceId ? "border-primary" : "border-border",
                      )}
                    >
                      <span>
                        <span className="block font-medium">{item.name}</span>
                        {item.description ? <span className="mt-0.5 block text-sm text-muted">{item.description}</span> : null}
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                          <Clock className="size-3" aria-hidden />
                          {tc("minutes", { count: item.durationMin })}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium">
                        <Price amount={item.price} isFrom={item.priceIsFrom} currency={currency} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          : null}

        {step === "options" && service ? (
          <>
            <StepTitle>{t("chooseOptions")}</StepTitle>
            <div className="space-y-6">
              {service.groups.map((group) => (
                <fieldset key={group.id}>
                  <legend className="mb-2 flex items-center gap-2 font-medium">
                    {group.name}
                    <span className="text-xs font-normal text-muted">
                      {group.selection === "single" ? t("pickOne") : t("pickAny")}
                      {group.isRequired ? ` · ${t("required")}` : ""}
                    </span>
                  </legend>
                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const checked = optionIds.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-theme border bg-card p-3",
                            checked ? "border-primary" : "border-border",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type={group.selection === "single" ? "radio" : "checkbox"}
                              name={`group-${group.id}`}
                              checked={checked}
                              onChange={() => toggleOption(group, option.id)}
                              onClick={() => {
                                // Radios cannot be unticked natively; allow it for optional groups.
                                if (group.selection === "single" && checked && !group.isRequired) {
                                  toggleOption(group, option.id);
                                }
                              }}
                              className="size-4 accent-[var(--primary)]"
                            />
                            {option.name}
                          </span>
                          <span className="text-end text-sm text-muted">
                            {option.priceDelta !== 0 ? (
                              <span className="block">
                                {option.priceDelta > 0 ? "+" : ""}
                                {formatMoney(option.priceDelta, currency, locale)}
                              </span>
                            ) : null}
                            {option.durationDelta !== 0 ? (
                              <span className="block">
                                {option.durationDelta > 0 ? "+" : ""}
                                {tc("minutes", { count: option.durationDelta })}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </>
        ) : null}

        {step === "staff" ? (
          <>
            <StepTitle>{t("chooseStaff")}</StepTitle>
            <div className="space-y-2">
              <StaffChoice
                selected={staffId === null}
                onSelect={() => {
                  setStaffId(null);
                  setStartsAt(null);
                }}
                name={t("anyStaff")}
                hint={t("anyStaffHint")}
                avatarUrl={null}
              />
              {eligibleStaff.map((member) => (
                <StaffChoice
                  key={member.id}
                  selected={staffId === member.id}
                  onSelect={() => {
                    setStaffId(member.id);
                    setStartsAt(null);
                  }}
                  name={member.name}
                  avatarUrl={member.avatarUrl}
                />
              ))}
            </div>
          </>
        ) : null}

        {step === "time" ? (
          <>
            <StepTitle>{t("chooseTime")}</StepTitle>
            <SlotPicker days={props.days} timeZone={timeZone} query={slotQuery} value={startsAt} onChange={setStartsAt} />
          </>
        ) : null}

        {step === "details" && service && startsAt !== null ? (
          <DetailsStep
            serviceId={service.id}
            optionIds={optionIds}
            staffId={staffId}
            startsAt={startsAt}
            turnstileSiteKey={props.turnstileSiteKey}
            approvalMode={props.approvalMode}
            summary={
              <dl className="space-y-2 text-sm">
                <SummaryRow label={t("summary")}>
                  {service.name}
                  {chosenOptions.length > 0 ? ` + ${chosenOptions.map((option) => option.name).join(", ")}` : ""}
                </SummaryRow>
                {selectedStaff ? <SummaryRow label={t("with")}>{selectedStaff.name}</SummaryRow> : null}
                <SummaryRow label={t("when")}>
                  {formatDate(startsAt, locale, timeZone)} · <span dir="ltr">{formatTime(startsAt, locale, timeZone)}</span>
                </SummaryRow>
                <SummaryRow label={t("duration")}>{tc("minutes", { count: totalDuration })}</SummaryRow>
                <SummaryRow label={t("total")}>
                  <Price amount={totalPrice} isFrom={service.priceIsFrom} currency={currency} />
                </SummaryRow>
              </dl>
            }
          />
        ) : null}
      </div>

      {step !== "service" && step !== "details" && service ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
            <div className="text-sm">
              <p className="font-semibold">
                <Price amount={totalPrice} isFrom={service.priceIsFrom} currency={currency} />
              </p>
              <p className="text-muted">{tc("minutes", { count: totalDuration })}</p>
            </div>
            <Button size="lg" disabled={!canContinue} onClick={goNext}>
              {tc("next")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-lg font-semibold">{children}</h2>;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-medium">{children}</dd>
    </div>
  );
}

type StaffChoiceProps = {
  selected: boolean;
  onSelect: () => void;
  name: string;
  hint?: string;
  avatarUrl: string | null;
};

function StaffChoice({ selected, onSelect, name, hint, avatarUrl }: StaffChoiceProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-theme border bg-card p-3 text-start",
        selected ? "border-primary" : "border-border",
      )}
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill className="object-cover" sizes="44px" />
        ) : (
          <UserRound className="size-5 text-muted" aria-hidden />
        )}
      </span>
      <span className="flex-1">
        <span className="block font-medium">{name}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
      {selected ? <Check className="size-5 text-primary" aria-hidden /> : null}
    </button>
  );
}

type DetailsStepProps = {
  serviceId: number;
  optionIds: number[];
  staffId: number | null;
  startsAt: number;
  turnstileSiteKey: string;
  approvalMode: boolean;
  summary: ReactNode;
};

function readSavedContact(): { name: string; phone: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "{}") as { name?: string; phone?: string };
    return { name: saved.name ?? "", phone: saved.phone ?? "" };
  } catch {
    return { name: "", phone: "" };
  }
}

/** Only rendered after the customer has stepped through the wizard, so it never runs on the server. */
function DetailsStep({ summary, turnstileSiteKey, approvalMode, ...booking }: DetailsStepProps) {
  const t = useTranslations("booking");
  const router = useRouter();
  const [contact, setContact] = useState(readSavedContact);
  const [note, setNote] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createBooking({ ...booking, ...contact, note, turnstileToken });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
      } catch {
        // Private mode or storage disabled: nothing to remember.
      }
      router.push(`/booking/${result.token}?new=1`);
    });
  }

  const inputClass =
    "h-11 w-full rounded-theme border border-border bg-card px-3 text-base focus:outline-2 focus:outline-primary";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-theme border border-border bg-card p-4">{summary}</div>
      <StepTitle>{t("yourDetails")}</StepTitle>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("name")}</span>
        <input
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          value={contact.name}
          onChange={(event) => setContact({ ...contact, name: event.target.value })}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("phone")}</span>
        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={contact.phone}
          onChange={(event) => setContact({ ...contact, phone: event.target.value })}
          className={cn(inputClass, "text-start")}
        />
        <span className="block text-xs text-muted">{t("phoneHint")}</span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("note")}</span>
        <textarea
          rows={2}
          maxLength={500}
          placeholder={t("notePlaceholder")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={cn(inputClass, "h-auto py-2")}
        />
      </label>
      <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
      {error ? (
        <p role="alert" className="rounded-theme bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {approvalMode ? <p className="text-center text-sm text-muted">{t("approvalNote")}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending || (Boolean(turnstileSiteKey) && !turnstileToken)}>
        {t("submit")}
      </Button>
    </form>
  );
}
