import { Hourglass, X } from "lucide-react";
import type { ReactNode } from "react";
import type { BookingStatus } from "@/db/schema";
import { cn, stagger } from "@/lib/utils";

/** Big status mark at the top of the customer's booking page; the check draws itself in. */
export function StatusMark({ status }: { status: BookingStatus }) {
  if (status === "confirmed" || status === "completed") {
    return (
      <div className="relative mx-auto flex size-20 animate-scale-in items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/15 [animation-iteration-count:2]" />
        <svg
          viewBox="0 0 24 24"
          className="relative size-10"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} className="animate-draw" />
        </svg>
      </div>
    );
  }
  const pending = status === "pending";
  const Icon = pending ? Hourglass : X;
  return (
    <div
      className={cn(
        "relative mx-auto flex size-20 animate-scale-in items-center justify-center rounded-full",
        pending ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-accent text-muted",
      )}
    >
      {pending ? <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/15 [animation-iteration-count:2]" /> : null}
      <Icon className="relative size-9" aria-hidden />
    </div>
  );
}

type TicketProps = {
  month: string;
  day: string;
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
  dimmed?: boolean;
};

/** The appointment as a ticket: a date block on top, a perforated line, then the details. */
export function Ticket({ month, day, title, subtitle, children, dimmed }: TicketProps) {
  return (
    <div className="animate-fade-up overflow-hidden rounded-theme border border-border bg-card shadow-lift" style={stagger(2)}>
      <div className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex w-16 shrink-0 flex-col items-center rounded-theme py-2",
            dimmed ? "bg-accent text-muted" : "bg-primary text-primary-foreground shadow-glow",
          )}
        >
          <span className="text-xs font-medium opacity-90">{month}</span>
          <span className="text-2xl leading-tight font-bold tabular-nums">{day}</span>
        </div>
        <div className="min-w-0">
          <p className={cn("text-lg font-semibold leading-snug", dimmed && "text-muted line-through")}>{title}</p>
          <p className="mt-0.5 text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="relative" aria-hidden>
        <div className="mx-5 border-t-2 border-dashed border-border" />
        <span className="absolute -start-3 -top-3 size-6 rounded-full bg-background shadow-[inset_0_0_0_1px_var(--border)]" />
        <span className="absolute -end-3 -top-3 size-6 rounded-full bg-background shadow-[inset_0_0_0_1px_var(--border)]" />
      </div>
      <dl className="space-y-3 p-5 text-sm">{children}</dl>
    </div>
  );
}

export function TicketRow({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-end font-medium", strong && "text-base font-bold text-primary")}>{children}</dd>
    </div>
  );
}
