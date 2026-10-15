"use client";

import { AlertCircle, Check, ChevronDown } from "lucide-react";
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { useFieldError } from "./action-form";
import { controlClass } from "./control";


type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: (props: { id: string; invalid: boolean }) => ReactNode;
  name?: string;
};

/** Label, control, hint and the field's error from the surrounding ActionForm. */
export function Field({ label, hint, className, children, name }: FieldProps) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({ id, invalid: Boolean(error) })}
      {error ? (
        <p className="flex animate-fade-in items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: ReactNode;
  name: string;
  /** Icon inside the input, at the start, e.g. icon={<Mail />}. */
  icon?: ReactNode;
};

const iconSlot = "pointer-events-none absolute start-3.5 top-1/2 flex -translate-y-1/2 text-muted [&>svg]:size-4";

export function InputField({ label, hint, className, name, icon, ...props }: InputFieldProps) {
  return (
    <Field label={label} hint={hint} className={className} name={name}>
      {({ id, invalid }) => (
        // The icon sits on the same side as the text starts, also in left-to-right fields on Arabic pages.
        <div className="relative" dir={icon ? props.dir : undefined}>
          {icon ? (
            <span className={iconSlot} aria-hidden>
              {icon}
            </span>
          ) : null}
          <input
            id={id}
            name={name}
            aria-invalid={invalid || undefined}
            className={cn(controlClass, "h-11", icon && "ps-10")}
            {...props}
          />
        </div>
      )}
    </Field>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode;
  hint?: ReactNode;
  name: string;
};

export function TextareaField({ label, hint, className, name, rows = 3, ...props }: TextareaFieldProps) {
  return (
    <Field label={label} hint={hint} className={className} name={name}>
      {({ id, invalid }) => (
        <textarea
          id={id}
          name={name}
          rows={rows}
          aria-invalid={invalid || undefined}
          className={cn(controlClass, "resize-y py-2.5 leading-relaxed")}
          {...props}
        />
      )}
    </Field>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  hint?: ReactNode;
  name: string;
  options: { value: string | number; label: string }[];
};

export function SelectField({ label, hint, className, name, options, ...props }: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} className={className} name={name}>
      {({ id, invalid }) => (
        <Select id={id} name={name} aria-invalid={invalid || undefined} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode };
type SwitchProps = CheckboxProps & {
  /** Toggle first, then the label, side by side (for compact rows). */
  inline?: boolean;
};

/** A checkbox for picking items from a list (services, staff). For on/off settings use Switch. */
export function Checkbox({ label, hint, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 text-sm", className)}>
      <span className="relative mt-px flex size-5 shrink-0">
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-[6px] border border-border bg-card shadow-xs outline-none transition checked:border-primary checked:bg-primary group-hover:border-primary/50 focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-50"
          {...props}
        />
        <Check
          className="pointer-events-none absolute inset-0 m-auto size-3.5 scale-50 text-primary-foreground opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
          strokeWidth={3}
          aria-hidden
        />
      </span>
      <span className="min-w-0">
        <span className="font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

/** An on/off setting: label and hint at the start, a toggle at the end. Submits "on" like a checkbox. */
export function Switch({ label, hint, className, inline, ...props }: SwitchProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 text-sm",
        inline ? "justify-start gap-3" : "justify-between",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span> : null}
      </span>
      <span className={cn("relative mt-px inline-flex h-6 w-11 shrink-0", inline && "order-first")}>
        <input
          type="checkbox"
          role="switch"
          className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-border outline-none transition-colors checked:bg-primary focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-50"
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute start-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
        />
      </span>
    </label>
  );
}

/** A group of switches separated by lines. */
export function SwitchList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("divide-y divide-border rounded-theme border border-border bg-card [&>*]:px-4 [&>*]:py-3.5", className)}>
      {children}
    </div>
  );
}

type RadioCardsProps = {
  name: string;
  legend?: ReactNode;
  defaultValue: string;
  options: { value: string; label: ReactNode; hint?: ReactNode; icon?: ReactNode }[];
  className?: string;
};

/** Big, tappable choices for a setting with a few options. Works without JavaScript. */
export function RadioCards({ name, legend, defaultValue, options, className }: RadioCardsProps) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      {legend ? <legend className="mb-2 text-sm font-medium">{legend}</legend> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ value, label, hint, icon }) => (
          <label
            key={value}
            className="group relative flex cursor-pointer items-start gap-3 rounded-theme border border-border bg-card p-4 shadow-xs transition hover:border-primary/40 has-checked:border-primary has-checked:bg-primary-tint has-checked:ring-4 has-checked:ring-ring has-focus-visible:ring-4 has-focus-visible:ring-ring"
          >
            <input type="radio" name={name} value={value} defaultChecked={value === defaultValue} className="peer sr-only" />
            {icon ? (
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-theme bg-accent text-muted transition group-has-checked:bg-primary group-has-checked:text-primary-foreground [&>svg]:size-[18px]"
              >
                {icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span> : null}
            </span>
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border transition peer-checked:border-primary peer-checked:bg-primary">
              <span className="size-2 rounded-full bg-primary-foreground opacity-0 transition peer-checked:opacity-100 group-has-checked:opacity-100" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Plain styled controls for places that lay out their own labels. */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, "h-11", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(controlClass, "h-11 cursor-pointer appearance-none pe-10")} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}
