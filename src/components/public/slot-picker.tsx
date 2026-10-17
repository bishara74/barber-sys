"use client";

import { CalendarX2, Moon, Sun, Sunrise } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Slot } from "@/lib/availability";
import { formatDay, formatTime, localMinutes } from "@/lib/time";
import { cn, stagger } from "@/lib/utils";

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

const PERIODS = [
  { key: "morning", icon: Sunrise, until: 12 * 60 },
  { key: "afternoon", icon: Sun, until: 17 * 60 },
  { key: "evening", icon: Moon, until: 24 * 60 },
] as const;

/** Day strip plus the free start times for the selected day, loaded from /api/slots. */
export function SlotPicker({ days, timeZone, query, value, onChange }: SlotPickerProps) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const [date, setDate] = useState(() => days.find((day) => day.open)?.date ?? days[0]?.date ?? "");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const selectedDay = useRef<HTMLButtonElement>(null);

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

  // Keep the chosen day in view in the strip.
  useEffect(() => {
    selectedDay.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [date]);

  const slots = loading ? [] : (loaded?.slots ?? []);
  const groups = PERIODS.map((period, index) => ({
    ...period,
    slots: slots.filter((slot) => {
      const minutes = localMinutes(slot.start, timeZone);
      return minutes < period.until && (index === 0 || minutes >= PERIODS[index - 1].until);
    }),
  })).filter((group) => group.slots.length > 0);

  const nextOpen = days.find((day) => day.open && day.date > date);
  const pick = (day: string) => {
    setDate(day);
    onChange(null);
  };
  const dayLabel = (day: string, index: number) =>
    index === 0 ? t("today") : index === 1 ? t("tomorrow") : formatDay(day, locale, { weekday: "short" });

  return (
    <div className="space-y-5">
      <div className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1">
        {days.map((day, index) => {
          const selected = day.date === date;
          return (
            <button
              key={day.date}
              ref={selected ? selectedDay : undefined}
              type="button"
              disabled={!day.open}
              aria-pressed={selected}
              onClick={() => pick(day.date)}
              className={cn(
                "flex w-[4.5rem] shrink-0 snap-start flex-col items-center gap-0.5 rounded-theme border px-2 py-2.5 transition",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                  : "border-border bg-card hover:border-primary/50 active:scale-95",
                !day.open && "cursor-not-allowed opacity-35",
              )}
            >
              <span className={cn("max-w-full truncate text-[11px] font-medium", !selected && "text-muted")}>
                {dayLabel(day.date, index)}
              </span>
              <span className="text-xl font-bold leading-tight tabular-nums">
                {formatDay(day.date, locale, { day: "numeric" })}
              </span>
              <span className={cn("text-[11px]", !selected && "text-muted")}>
                {formatDay(day.date, locale, { month: "short" })}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label={t("loadingSlots")} aria-busy>
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="skeleton h-11" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex animate-fade-up flex-col items-center gap-3 rounded-theme border border-dashed border-border bg-surface/60 px-6 py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-card text-muted shadow-soft">
            <CalendarX2 className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted">{t("noSlots")}</p>
          {nextOpen ? (
            <button
              type="button"
              onClick={() => pick(nextOpen.date)}
              className="rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary transition hover:brightness-95"
            >
              {t("tryDay", { day: formatDay(nextOpen.date, locale, { weekday: "long", day: "numeric", month: "short" }) })}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ key: period, icon: Icon, slots: periodSlots }) => (
            <section key={period}>
              <h3 className="mb-2.5 flex items-center gap-2 text-sm font-medium text-muted">
                <Icon className="size-4" aria-hidden />
                {t(period)}
              </h3>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" dir="ltr">
                {periodSlots.map((slot, index) => (
                  <button
                    key={slot.start}
                    type="button"
                    aria-pressed={slot.start === value}
                    onClick={() => onChange(slot.start)}
                    style={stagger(index)}
                    className={cn(
                      "h-11 animate-fade-up rounded-theme border text-sm font-semibold tabular-nums transition",
                      slot.start === value
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border bg-card hover:border-primary hover:text-primary active:scale-95",
                    )}
                  >
                    {formatTime(slot.start, locale, timeZone)}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
