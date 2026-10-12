"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Slot } from "@/lib/availability";
import { formatDay, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export type BookingDay = { date: string; open: boolean };

type SlotPickerProps = {
  days: BookingDay[];
  timeZone: string;
  /** Search params that describe what is being booked, e.g. "service=3&options=7" or "booking=<token>". */
  query: string;
  value: number | null;
  onChange: (start: number | null) => void;
};

type Loaded = { key: string; slots: Slot[] };

/** Day strip plus the free start times for the selected day, loaded from /api/slots. */
export function SlotPicker({ days, timeZone, query, value, onChange }: SlotPickerProps) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const [date, setDate] = useState(() => days.find((day) => day.open)?.date ?? days[0]?.date ?? "");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const key = `date=${date}&${query}`;
  const loading = loaded?.key !== key;

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    fetch(`/api/slots?${key}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<{ slots?: Slot[] }>)
      .then((data) => setLoaded({ key, slots: data.slots ?? [] }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setLoaded({ key, slots: [] });
        }
      });
    return () => controller.abort();
  }, [date, key]);

  const slots = loading ? [] : (loaded?.slots ?? []);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            disabled={!day.open}
            onClick={() => {
              setDate(day.date);
              onChange(null);
            }}
            className={cn(
              "flex w-16 shrink-0 snap-start flex-col items-center rounded-theme border px-2 py-2 text-sm transition",
              day.date === date ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              !day.open && "opacity-40",
            )}
          >
            <span className="text-xs">{formatDay(day.date, locale, { weekday: "short" })}</span>
            <span className="text-lg font-semibold">{formatDay(day.date, locale, { day: "numeric" })}</span>
            <span className="text-xs">{formatDay(day.date, locale, { month: "short" })}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted">{t("loadingSlots")}</p>
      ) : slots.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("noSlots")}</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" dir="ltr">
          {slots.map((slot) => (
            <button
              key={slot.start}
              type="button"
              onClick={() => onChange(slot.start)}
              className={cn(
                "h-11 rounded-theme border text-sm font-medium transition",
                slot.start === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary",
              )}
            >
              {formatTime(slot.start, locale, timeZone)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
