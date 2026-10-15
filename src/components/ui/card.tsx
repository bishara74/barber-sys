import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-theme border border-border bg-card p-4 shadow-soft sm:p-5", className)} {...props} />;
}

type SectionProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

/** A titled card, the main building block of dashboard pages. */
export function Section({ title, description, icon: Icon, actions, children, className, id }: SectionProps) {
  return (
    <Card id={id} className={cn("scroll-mt-24 space-y-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-theme bg-primary-soft text-primary">
              <Icon className="size-[18px]" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="font-semibold leading-tight">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A back link or button shown above the title. */
  back?: ReactNode;
  /** Shown before the title, e.g. an avatar. */
  leading?: ReactNode;
};

export function PageHeader({ title, description, actions, back, leading }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {leading}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">{title}</h1>
            {description ? <div className="mt-1 text-sm text-muted">{description}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

type EmptyStateProps = { children: ReactNode; icon?: LucideIcon; action?: ReactNode; className?: string };

export function EmptyState({ children, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-theme border border-dashed border-border bg-surface/60 px-6 py-8 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-11 items-center justify-center rounded-full bg-card text-muted shadow-soft">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <p className="max-w-sm text-sm text-muted">{children}</p>
      {action}
    </div>
  );
}

const tones = {
  neutral: "bg-accent text-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  danger: "bg-red-500/12 text-red-700 dark:text-red-400",
  info: "bg-sky-500/12 text-sky-800 dark:text-sky-300",
};

export type BadgeTone = keyof typeof tones;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean };

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

type StatTileProps = {
  label: ReactNode;
  value: ReactNode;
  icon: LucideIcon;
  hint?: ReactNode;
  tone?: "primary" | "warning" | "success" | "info";
  /** Leave the icon out on phones, for rows of three tiles. */
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const statTones = {
  primary: "bg-primary-soft text-primary",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  info: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
};

/** A big number with a label, for the dashboard. */
export function StatTile({ label, value, icon: Icon, hint, tone = "primary", compact, className, style }: StatTileProps) {
  return (
    <Card className={cn("flex items-start justify-between gap-3", className)} style={style}>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1.5 text-3xl font-bold tabular-nums leading-none">{value}</p>
        {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
      </div>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-theme",
          compact && "max-sm:hidden",
          statTones[tone],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
    </Card>
  );
}

type AvatarProps = { name: string; src?: string | null; className?: string; sizes?: string };

/** A round photo, or the person's initials on a soft tint of the main color. */
export function Avatar({ name, src, className, sizes = "48px" }: AvatarProps) {
  const words = name.trim().split(/\s+/);
  // Two Arabic letters side by side join into a word, so Arabic names get one letter.
  const count = /^[؀-ۿ]/.test(words[0] ?? "") ? 1 : 2;
  const initials = words
    .slice(0, count)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-semibold text-primary",
        className,
      )}
      aria-hidden
    >
      {src ? <Image src={src} alt="" fill className="object-cover" sizes={sizes} /> : initials || "?"}
    </span>
  );
}
