import { MINUTE, zonedTime } from "./time";

export type Interval = { start: number; end: number };

/** A working period in minutes from local midnight. */
export type Shift = { startMin: number; endMin: number };

export type StaffAvailability = {
  staffId: number;
  shifts: Shift[];
  /** Bookings (until their buffer ends) and time off, as instants. */
  busy: Interval[];
};

export type SlotRequest = {
  date: string;
  timeZone: string;
  /** Minutes the appointment itself takes. */
  occupiedMin: number;
  /** Minutes kept free after the appointment. */
  bufferMin: number;
  /** Start times are multiples of this many minutes from midnight. */
  stepMin: number;
  /** No slot may start before this instant (now + minimum notice). */
  earliestStart: number;
  staff: StaffAvailability[];
};

export type Slot = { start: number; staffIds: number[] };

export type SlotSettings = {
  slotMode: "service" | "fixed";
  fixedSlotMin: number;
  slotStepMin: number;
};

export type SlotPlan = { occupiedMin: number; bufferMin: number; stepMin: number };

/**
 * How much time a booking takes on the calendar. In fixed mode every appointment
 * snaps to whole fixed-length slots; otherwise it uses the real duration plus buffer.
 */
export function slotPlan(settings: SlotSettings, durationMin: number, bufferMin: number): SlotPlan {
  if (settings.slotMode === "fixed") {
    const length = settings.fixedSlotMin;
    return {
      occupiedMin: Math.max(1, Math.ceil(durationMin / length)) * length,
      bufferMin: 0,
      stepMin: length,
    };
  }
  return { occupiedMin: durationMin, bufferMin, stepMin: settings.slotStepMin };
}

/** True when every shift ends after it starts and no two shifts on the same day overlap. */
export function validWeek(shifts: (Shift & { weekday: number })[]): boolean {
  for (let weekday = 0; weekday < 7; weekday++) {
    const day = shifts.filter((shift) => shift.weekday === weekday).sort((a, b) => a.startMin - b.startMin);
    for (let i = 0; i < day.length; i++) {
      const shift = day[i];
      if (shift.startMin < 0 || shift.endMin > 24 * 60 || shift.endMin <= shift.startMin) return false;
      if (i > 0 && shift.startMin < day[i - 1].endMin) return false;
    }
  }
  return shifts.every((shift) => Number.isInteger(shift.weekday) && shift.weekday >= 0 && shift.weekday <= 6);
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Every start time on a date where at least one staff member is free, with who is free. */
export function computeSlots(request: SlotRequest): Slot[] {
  const { date, timeZone, occupiedMin, bufferMin, stepMin, earliestStart } = request;
  const byStart = new Map<number, Set<number>>();

  for (const member of request.staff) {
    for (const shift of member.shifts) {
      const first = Math.ceil(shift.startMin / stepMin) * stepMin;
      for (let minute = first; minute + occupiedMin <= shift.endMin; minute += stepMin) {
        const start = zonedTime(date, minute, timeZone);
        if (start < earliestStart) continue;

        const window = { start, end: start + (occupiedMin + bufferMin) * MINUTE };
        if (member.busy.some((busy) => overlaps(window, busy))) continue;

        const staffIds = byStart.get(start) ?? new Set<number>();
        staffIds.add(member.staffId);
        byStart.set(start, staffIds);
      }
    }
  }

  return [...byStart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, staffIds]) => ({ start, staffIds: [...staffIds] }));
}
