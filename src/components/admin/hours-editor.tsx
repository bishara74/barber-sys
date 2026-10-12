"use client";

import { Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { saveHours } from "@/actions/staff";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatClock, parseClock, weekdayName } from "@/lib/time";

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
      <ul className="divide-y divide-border">
        {week.map((shifts, weekday) => (
          <li key={weekday} className="flex flex-wrap items-start gap-3 py-2.5">
            <span className="w-24 pt-2 text-sm font-medium">
              {weekdayName(weekday, locale)}
            </span>
            <div className="flex flex-1 flex-col gap-2">
              {shifts.length === 0 ? <span className="pt-2 text-sm text-muted">{t("dayOff")}</span> : null}
              {shifts.map((shift, index) => (
                <div key={index} className="flex items-center gap-2" dir="ltr">
                  <Input
                    type="time"
                    step={300}
                    value={shift.start}
                    aria-label={`${t("hours")} ${index + 1}`}
                    onChange={(event) =>
                      update(weekday, shifts.map((s, i) => (i === index ? { ...s, start: event.target.value } : s)))
                    }
                    className="w-32"
                  />
                  <span className="text-muted">–</span>
                  <Input
                    type="time"
                    step={300}
                    value={shift.end}
                    aria-label={`${t("hours")} ${index + 1}`}
                    onChange={(event) =>
                      update(weekday, shifts.map((s, i) => (i === index ? { ...s, end: event.target.value } : s)))
                    }
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tc("delete")}
                    onClick={() => update(weekday, shifts.filter((_, i) => i !== index))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const last = shifts.at(-1);
                update(weekday, [...shifts, last ? { start: last.end, end: "23:00" } : DEFAULT_SHIFT]);
              }}
            >
              <Plus className="size-4" aria-hidden />
              {t("addShift")}
            </Button>
          </li>
        ))}
      </ul>
      <SubmitButton>{tc("save")}</SubmitButton>
    </ActionForm>
  );
}
