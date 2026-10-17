"use client";

import { Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { saveHours } from "@/actions/staff";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input, Switch } from "@/components/ui/field";
import { formatClock, parseClock, weekdayName } from "@/lib/time";
import { cn } from "@/lib/utils";

type Shift = { weekday: number; startMin: number; endMin: number };
type DraftShift = { start: string; end: string };

const DEFAULT_SHIFT: DraftShift = { start: "09:00", end: "19:00" };

/** Weekly working hours. Two shifts on one day leave a break between them. */
export function HoursEditor({ staffId, hours }: { staffId: number; hours: Shift[] }) {
  const t = useTranslations("admin.staff");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [week, setWeek] = useState<DraftShift[][]>(() =>
    Array.from({ length: 7 }, (_, weekday) =>
      hours
        .filter((shift) => shift.weekday === weekday)
        .sort((a, b) => a.startMin - b.startMin)
        .map((shift) => ({ start: formatClock(shift.startMin), end: formatClock(shift.endMin) })),
    ),
  );

  const update = (weekday: number, shifts: DraftShift[]) =>
    setWeek((current) => current.map((day, index) => (index === weekday ? shifts : day)));

  // A day switched on starts with the hours of the nearest open day before it.
  const hoursToCopy = (weekday: number) =>
    (
      [...week.slice(0, weekday)].reverse().find((day) => day.length > 0) ??
      week.find((day) => day.length > 0) ?? [DEFAULT_SHIFT]
    ).map((shift) => ({ ...shift }));

  const serialized = week.flatMap((shifts, weekday) =>
    shifts.map((shift) => ({
      weekday,
      startMin: parseClock(shift.start) ?? -1,
      endMin: parseClock(shift.end) ?? -1,
    })),
  );

  return (
    <ActionForm action={saveHours}>
      <input type="hidden" name="id" value={staffId} />
      <input type="hidden" name="hours" value={JSON.stringify(serialized)} />
      <ul className="divide-y divide-border rounded-theme border border-border">
        {week.map((shifts, weekday) => {
          const open = shifts.length > 0;
          return (
            <li
              key={weekday}
              className={cn("flex flex-wrap items-start gap-x-4 gap-y-2 px-3 py-3 transition-colors sm:px-4", !open && "bg-surface/60")}
            >
              <Switch
                inline
                checked={open}
                onChange={(event) => update(weekday, event.target.checked ? hoursToCopy(weekday) : [])}
                label={weekdayName(weekday, locale)}
                className="w-32 shrink-0 pt-2"
              />
              <div className="flex min-w-0 flex-1 basis-[17.5rem] flex-col gap-2">
                {open ? null : <span className="pt-2 text-sm text-muted">{t("dayOff")}</span>}
                {shifts.map((shift, index) => (
                  <div key={index} className="flex animate-fade-in items-center gap-2" dir="ltr">
                    <Input
                      type="time"
                      step={300}
                      value={shift.start}
                      aria-label={`${weekdayName(weekday, locale)} ${t("from")} ${index + 1}`}
                      onChange={(event) =>
                        update(weekday, shifts.map((s, i) => (i === index ? { ...s, start: event.target.value } : s)))
                      }
                      className="min-w-0 flex-1 px-2.5 sm:w-32 sm:flex-none sm:px-3.5"
                    />
                    <span className="text-muted">–</span>
                    <Input
                      type="time"
                      step={300}
                      value={shift.end}
                      aria-label={`${weekdayName(weekday, locale)} ${t("to")} ${index + 1}`}
                      onChange={(event) =>
                        update(weekday, shifts.map((s, i) => (i === index ? { ...s, end: event.target.value } : s)))
                      }
                      className="min-w-0 flex-1 px-2.5 sm:w-32 sm:flex-none sm:px-3.5"
                    />
                    <Button
                      variant="danger-ghost"
                      size="icon-sm"
                      aria-label={tc("delete")}
                      onClick={() => update(weekday, shifts.filter((_, i) => i !== index))}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {open ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => {
                    const last = shifts.at(-1)!;
                    update(weekday, [...shifts, { start: last.end, end: "23:00" }]);
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  {t("addShift")}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <SubmitButton>{tc("save")}</SubmitButton>
    </ActionForm>
  );
}
