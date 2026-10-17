"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Info,
  MessageSquareText,
  Phone,
  Scissors,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { createBooking } from "@/actions/public";
import { Turnstile } from "@/components/turnstile";
import { Button, Spinner } from "@/components/ui/button";
import { controlClass } from "@/components/ui/control";
import type { ViewGroup, ViewService, ViewType } from "@/lib/catalog-view";
import { formatMoney } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";
import { cn, stagger } from "@/lib/utils";
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

  const goTo = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goNext = () => goTo(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  const goBack = () => goTo(steps[Math.max(stepIndex - 1, 0)]);

  function chooseService(next: ViewService) {
    setServiceId(next.id);
    setOptionIds(defaultOptions(next));
    setStaffId(null);
    setStartsAt(null);
    goTo(stepsFor(next, staff, allowStaffChoice)[1]);
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
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CalendarDays className="size-6" aria-hidden />
        </span>
        <p className="max-w-xs text-muted">{t("nothingToBook")}</p>
        <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {tc("back")}
        </Link>
      </div>
    );
  }

  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const selectedStaff = staff.find((member) => member.id === staffId);
  const canContinue =
    (step === "options" && optionsValid) || step === "staff" || (step === "time" && startsAt !== null);
  const backClass =
    "flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-xs transition hover:border-primary/40 active:scale-95";

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/85 px-4 pt-3 pb-3.5 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          {stepIndex > 0 ? (
            <button type="button" onClick={goBack} className={backClass} aria-label={tc("back")}>
              <Back className="size-[18px]" />
            </button>
          ) : (
            <Link href="/" className={backClass} aria-label={tc("back")}>
              <Back className="size-[18px]" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted">
              {t("stepOf", { current: stepIndex + 1, total: steps.length })}
            </p>
            <h1 className="truncate font-semibold leading-tight">{stepLabels[step]}</h1>
          </div>
        </div>
        <ol className="mt-3 flex gap-1.5" aria-label={t("title")}>
          {steps.map((name, index) => (
            <li key={name} className="flex-1">
              <button
                type="button"
                disabled={index >= stepIndex}
                onClick={() => goTo(name)}
                aria-current={index === stepIndex ? "step" : undefined}
                aria-label={stepLabels[name]}
                className="group block w-full py-1 disabled:cursor-default"
              >
                <span className="block h-1.5 overflow-hidden rounded-full bg-border">
                  <span
                    className={cn(
                      "block h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
                      index <= stepIndex ? "w-full" : "w-0",
                    )}
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      {/* Keyed by step so every step fades in. */}
      <div key={step} className="animate-fade-up pt-6">
        {step === "service" ? (
          <>
            <StepTitle>{t("chooseService")}</StepTitle>
            <div className="space-y-6">
              {types.map((type) => (
                <section key={type.id}>
                  {types.length > 1 ? (
                    <h3 className="mb-2.5 text-sm font-semibold text-muted">{type.name}</h3>
                  ) : null}
                  <div className="space-y-2.5">
                    {type.services.map((item, index) => {
                      const selected = item.id === serviceId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => chooseService(item)}
                          style={stagger(index)}
                          className={cn(
                            "group flex w-full animate-fade-up items-start gap-3 rounded-theme border bg-card p-4 text-start shadow-xs transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lift active:scale-[0.99]",
                            selected ? "border-primary ring-4 ring-ring" : "border-border",
                          )}
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                            <Scissors className="size-[18px]" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className="font-semibold">{item.name}</span>
                              <span className="shrink-0 font-semibold text-primary">
                                <Price amount={item.price} isFrom={item.priceIsFrom} currency={currency} />
                              </span>
                            </span>
                            {item.description ? (
                              <span className="mt-0.5 block text-sm text-muted">{item.description}</span>
                            ) : null}
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-muted">
                              <Clock className="size-3" aria-hidden />
                              {tc("minutes", { count: item.durationMin })}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : null}

        {step === "options" && service ? (
          <>
            <StepTitle hint={service.name}>{t("chooseOptions")}</StepTitle>
            <div className="space-y-7">
              {service.groups.map((group) => (
                <fieldset key={group.id}>
                  <legend className="mb-3 flex w-full items-center justify-between gap-2">
                    <span className="font-semibold">{group.name}</span>
                    <span className="flex gap-1.5">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted">
                        {group.selection === "single" ? t("pickOne") : t("pickAny")}
                      </span>
                      {group.isRequired ? (
                        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                          {t("required")}
                        </span>
                      ) : null}
                    </span>
                  </legend>
                  <div className="space-y-2">
                    {group.options.map((option, index) => {
                      const checked = optionIds.includes(option.id);
                      const single = group.selection === "single";
                      return (
                        <label
                          key={option.id}
                          style={stagger(index)}
                          className={cn(
                            "flex animate-fade-up cursor-pointer items-center gap-3 rounded-theme border bg-card p-3.5 shadow-xs transition hover:border-primary/50 has-focus-visible:ring-4 has-focus-visible:ring-ring",
                            checked ? "border-primary bg-primary-tint" : "border-border",
                          )}
                        >
                          <input
                            type={single ? "radio" : "checkbox"}
                            name={`group-${group.id}`}
                            checked={checked}
                            onChange={() => toggleOption(group, option.id)}
                            onClick={() => {
                              // Radios cannot be unticked natively; allow it for optional groups.
                              if (single && checked && !group.isRequired) toggleOption(group, option.id);
                            }}
                            className="sr-only"
                          />
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center border-2 transition",
                              single ? "rounded-full" : "rounded-md",
                              checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                            )}
                          >
                            {checked ? (
                              single ? (
                                <span className="size-2 rounded-full bg-primary-foreground" />
                              ) : (
                                <Check className="size-3.5" strokeWidth={3} />
                              )
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1 font-medium">{option.name}</span>
                          <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
                            {option.priceDelta !== 0 ? (
                              <span className="font-semibold text-primary" dir="ltr">
                                {option.priceDelta > 0 ? "+" : ""}
                                {formatMoney(option.priceDelta, currency, locale)}
                              </span>
                            ) : null}
                            {option.durationDelta !== 0 ? (
                              <span className="text-muted">
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
            <div className="grid grid-cols-2 gap-3">
              <StaffChoice
                selected={staffId === null}
                onSelect={() => {
                  setStaffId(null);
                  setStartsAt(null);
                }}
                name={t("anyStaff")}
                hint={t("anyStaffHint")}
                avatarUrl={null}
                index={0}
              />
              {eligibleStaff.map((member, index) => (
                <StaffChoice
                  key={member.id}
                  selected={staffId === member.id}
                  onSelect={() => {
                    setStaffId(member.id);
                    setStartsAt(null);
                  }}
                  name={member.name}
                  avatarUrl={member.avatarUrl}
                  index={index + 1}
                />
              ))}
            </div>
          </>
        ) : null}

        {step === "time" ? (
          <>
            <StepTitle hint={selectedStaff ? `${t("with")} ${selectedStaff.name}` : undefined}>{t("chooseTime")}</StepTitle>
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
              <div className="overflow-hidden rounded-theme border border-border bg-card shadow-soft">
                <div className="flex items-center gap-4 bg-primary px-4 py-3.5 text-primary-foreground">
                  <CalendarDays className="size-6 shrink-0 opacity-90" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-semibold">{formatDate(startsAt, locale, timeZone)}</p>
                    <p className="text-sm opacity-90" dir="ltr">
                      {formatTime(startsAt, locale, timeZone)} – {formatTime(startsAt + totalDuration * 60_000, locale, timeZone)}
                    </p>
                  </div>
                </div>
                <dl className="space-y-2.5 p-4 text-sm">
                  <SummaryRow label={t("summary")}>
                    {service.name}
                    {chosenOptions.length > 0 ? (
                      <span className="block text-xs font-normal text-muted">
                        + {chosenOptions.map((option) => option.name).join(locale === "ar" ? "، " : ", ")}
                      </span>
                    ) : null}
                  </SummaryRow>
                  {selectedStaff ? <SummaryRow label={t("with")}>{selectedStaff.name}</SummaryRow> : null}
                  <SummaryRow label={t("duration")}>{tc("minutes", { count: totalDuration })}</SummaryRow>
                  <div className="border-t border-dashed border-border pt-2.5">
                    <SummaryRow label={t("total")} strong>
                      <Price amount={totalPrice} isFrom={service.priceIsFrom} currency={currency} />
                    </SummaryRow>
                  </div>
                </dl>
              </div>
            }
          />
        ) : null}
      </div>

      {step !== "service" && step !== "details" && service ? (
        <div className="fixed inset-x-0 bottom-0 z-20 animate-slide-up border-t border-border bg-background/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="min-w-0 text-sm">
              <p className="text-lg font-bold leading-tight text-primary">
                <Price amount={totalPrice} isFrom={service.priceIsFrom} currency={currency} />
              </p>
              <p className="truncate text-muted">
                {tc("minutes", { count: totalDuration })}
                {startsAt !== null ? (
                  <>
                    {" · "}
                    <span dir="ltr">{formatTime(startsAt, locale, timeZone)}</span>
                  </>
                ) : null}
              </p>
            </div>
            <Button size="lg" className="group min-w-32" disabled={!canContinue} onClick={goNext}>
              {tc("next")}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold">{children}</h2>
      {hint ? <p className="mt-0.5 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

function SummaryRow({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-end font-medium", strong && "text-base font-bold text-primary")}>{children}</dd>
    </div>
  );
}

type StaffChoiceProps = {
  selected: boolean;
  onSelect: () => void;
  name: string;
  hint?: string;
  avatarUrl: string | null;
  index: number;
};

function StaffChoice({ selected, onSelect, name, hint, avatarUrl, index }: StaffChoiceProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={stagger(index)}
      className={cn(
        "relative flex animate-fade-up flex-col items-center gap-2.5 rounded-theme border bg-card p-4 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lift",
        selected ? "border-primary bg-primary-tint ring-4 ring-ring" : "border-border",
      )}
    >
      <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill className="object-cover" sizes="64px" />
        ) : hint ? (
          <Users className="size-7" aria-hidden />
        ) : (
          <UserRound className="size-7" aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{name}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-snug text-muted">{hint}</span> : null}
      </span>
      {selected ? (
        <span className="absolute end-2.5 top-2.5 flex size-6 animate-scale-in items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
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

  const inputClass = cn(controlClass, "h-12 ps-10 text-base");
  const iconClass = "pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted";

  return (
    <form onSubmit={submit} className="space-y-6">
      {summary}
      <div className="space-y-4">
        <StepTitle>{t("yourDetails")}</StepTitle>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("name")}</span>
          <span className="relative block">
            <UserRound className={iconClass} aria-hidden />
            <input
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={contact.name}
              onChange={(event) => setContact({ ...contact, name: event.target.value })}
              className={inputClass}
            />
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("phone")}</span>
          <span className="relative block" dir="ltr">
            <Phone className={iconClass} aria-hidden />
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="059 123 4567"
              value={contact.phone}
              onChange={(event) => setContact({ ...contact, phone: event.target.value })}
              className={cn(inputClass, "text-start")}
            />
          </span>
          <span className="block text-xs text-muted">{t("phoneHint")}</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("note")}</span>
          <span className="relative block">
            <MessageSquareText className="pointer-events-none absolute start-3.5 top-3.5 size-[18px] text-muted" aria-hidden />
            <textarea
              rows={2}
              maxLength={500}
              placeholder={t("notePlaceholder")}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={cn(controlClass, "resize-y py-3 ps-10 text-base")}
            />
          </span>
        </label>
      </div>
      <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
      {error ? (
        <p
          role="alert"
          className="animate-fade-up rounded-theme bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
      {approvalMode ? (
        <p className="flex items-start gap-2 rounded-theme bg-primary-tint px-3.5 py-2.5 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t("approvalNote")}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="btn-shine h-14 w-full text-base"
        aria-busy={pending}
        disabled={pending || (Boolean(turnstileSiteKey) && !turnstileToken)}
      >
        {pending ? <Spinner /> : <Check className="size-5" aria-hidden />}
        {t("submit")}
      </Button>
    </form>
  );
}
