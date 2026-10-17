import type { Shift } from "./availability";

export type OpeningStatus =
  | { open: true; until: number }
  | { open: false; next: { inDays: number; weekday: number; at: number } | null };

/**
 * Whether the shop is open at a moment, from its weekly hours (index 0 = Sunday, shifts sorted),
 * and if not, when it opens next. `minutes` is the local time of day.
 */
export function openingStatus(weekly: Shift[][], weekday: number, minutes: number): OpeningStatus {
  const current = weekly[weekday]?.find((shift) => shift.startMin <= minutes && minutes < shift.endMin);
  if (current) return { open: true, until: current.endMin };

  for (let inDays = 0; inDays <= 7; inDays++) {
    const day = (weekday + inDays) % 7;
    const shift = weekly[day]?.find((candidate) => inDays > 0 || candidate.startMin > minutes);
    if (shift) return { open: false, next: { inDays, weekday: day, at: shift.startMin } };
  }
  return { open: false, next: null };
}
