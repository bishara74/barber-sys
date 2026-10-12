"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { rescheduleBooking } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { SlotPicker, type BookingDay } from "./slot-picker";

type ReschedulePickerProps = { token: string; days: BookingDay[]; timeZone: string };

export function ReschedulePicker({ token, days, timeZone }: ReschedulePickerProps) {
  const t = useTranslations("manage");
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
        <p role="alert" className="rounded-theme bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <Button size="lg" className="w-full" disabled={startsAt === null || pending} onClick={confirm}>
        {t("reschedule")}
      </Button>
    </div>
  );
}
