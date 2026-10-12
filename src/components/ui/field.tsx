"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useFieldError } from "./action-form";

const control =
  "w-full rounded-theme border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted " +
  "focus:outline-2 focus:outline-offset-1 focus:outline-primary disabled:opacity-60 aria-invalid:border-red-500";

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
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: ReactNode;
  name: string;
};

export function InputField({ label, hint, className, name, ...props }: InputFieldProps) {
  return (
    <Field label={label} hint={hint} className={className} name={name}>
      {({ id, invalid }) => (
        <input id={id} name={name} aria-invalid={invalid || undefined} className={cn(control, "h-10")} {...props} />
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
          className={cn(control, "py-2")}
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
        <select id={id} name={name} aria-invalid={invalid || undefined} className={cn(control, "h-10")} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode };

export function Checkbox({ label, hint, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex items-start gap-3 text-sm", className)}>
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Plain styled controls for places that lay out their own labels. */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "h-10", className)} {...props} />;
}
