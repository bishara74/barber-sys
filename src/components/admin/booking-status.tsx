import { useTranslations } from "next-intl";
import type { BookingStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

/** Colors per status, shared by badges and calendar blocks. */
export const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "border-amber-500/60 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  confirmed: "border-emerald-500/60 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  completed: "border-sky-500/50 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  no_show: "border-rose-500/60 bg-rose-500/15 text-rose-800 dark:text-rose-300",
  cancelled: "border-border bg-accent text-muted line-through",
  declined: "border-border bg-accent text-muted line-through",
  expired: "border-border bg-accent text-muted line-through",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const t = useTranslations("status");
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_STYLES[status], className)}>
      {t(status)}
    </span>
  );
}
