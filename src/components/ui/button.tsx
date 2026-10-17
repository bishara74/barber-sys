import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-glow hover:brightness-110 hover:shadow-lift disabled:shadow-none",
  secondary: "bg-primary-soft text-primary hover:brightness-[0.97] dark:hover:brightness-125",
  outline: "border border-border bg-card text-foreground shadow-xs hover:border-primary/40 hover:bg-primary-tint",
  ghost: "text-foreground hover:bg-accent",
  danger: "bg-red-600 text-white shadow-xs hover:bg-red-700",
  "danger-ghost": "text-red-600 hover:bg-red-500/10 dark:text-red-400",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
  icon: "size-10",
  "icon-sm": "size-8",
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Button styles, also used for links that look like buttons. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-theme font-medium",
    "transition-[transform,background-color,border-color,box-shadow,filter,opacity] duration-200 active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-wait",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    variants[variant],
    sizes[size],
    className,
  );
}

/** A small spinning ring for buttons and other busy states. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-e-transparent", className)}
    />
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
