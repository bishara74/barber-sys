"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { rescheduleBooking } from "@/actions/public";
import { Button, Spinner } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/time";
import { SlotPicker, type BookingDay } from "./slot-picker";

type ReschedulePickerProps = { token: string; days: BookingDay[]; timeZone: string };

export function ReschedulePicker({ token, days, timeZone }: ReschedulePickerProps) {
  const t = useTranslations("manage");
  const locale = useLocale();
  const router = useRouter();
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (startsAt === null) return;
    setError(null);
    startTransition(async () => {
      const result = await rescheduleBooking(token, startsAt);
      if (result.ok) router.push(`/booking/${token}?moved=1`);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <SlotPicker
        days={days}
        timeZone={timeZone}
        query={new URLSearchParams({ booking: token }).toString()}
        value={startsAt}
        onChange={setStartsAt}
      />
      {error ? (
        <p
          role="alert"
          className="animate-fade-up rounded-theme bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="min-w-0 truncate text-sm font-medium">
            {startsAt !== null ? (
              <>
                {formatDate(startsAt, locale, timeZone, "short")} ·{" "}
                <span dir="ltr">{formatTime(startsAt, locale, timeZone)}</span>
              </>
            ) : null}
          </p>
          <Button size="lg" disabled={startsAt === null || pending} aria-busy={pending} onClick={confirm}>
            {pending ? <Spinner /> : <Check className="size-4" aria-hidden />}
            {t("reschedule")}
          </Button>
        </div>
      </div>
    </div>
  );
}
