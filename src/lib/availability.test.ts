import { describe, expect, it } from "vitest";
import { computeSlots, slotPlan, validWeek, type SlotRequest } from "./availability";
import { formatClock, localMinutes, MINUTE, zonedTime } from "./time";

const TZ = "Asia/Jerusalem";
const DATE = "2026-10-14"; // a Wednesday

const at = (clock: string, date = DATE) => {
  const [h, m] = clock.split(":").map(Number);
  return zonedTime(date, h * 60 + m, TZ);
};

function request(overrides: Partial<SlotRequest> = {}): SlotRequest {
  return {
    date: DATE,
    timeZone: TZ,
    occupiedMin: 30,
    bufferMin: 0,
    stepMin: 30,
    earliestStart: 0,
    staff: [{ staffId: 1, shifts: [{ startMin: 9 * 60, endMin: 11 * 60 }], busy: [] }],
    ...overrides,
  };
}

const clocks = (req: SlotRequest) =>
  computeSlots(req).map((slot) => formatClock(localMinutes(slot.start, TZ)));

describe("computeSlots", () => {
  it("fills a shift with slots that fit completely", () => {
    expect(clocks(request())).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(clocks(request({ occupiedMin: 45 }))).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("treats gaps between shifts as breaks", () => {
    const req = request({
      staff: [
        {
          staffId: 1,
          shifts: [
            { startMin: 9 * 60, endMin: 10 * 60 },
            { startMin: 11 * 60, endMin: 12 * 60 },
          ],
          busy: [],
        },
      ],
    });
    expect(clocks(req)).toEqual(["09:00", "09:30", "11:00", "11:30"]);
  });

  it("skips times that overlap a booking, including the new booking's buffer", () => {
    const busy = [{ start: at("10:00"), end: at("10:30") }];
    expect(clocks(request({ staff: [{ staffId: 1, shifts: [{ startMin: 540, endMin: 660 }], busy }] })))
      .toEqual(["09:00", "09:30", "10:30"]);

    const withBuffer = request({
      bufferMin: 15,
      staff: [{ staffId: 1, shifts: [{ startMin: 540, endMin: 660 }], busy }],
    });
    expect(clocks(withBuffer)).toEqual(["09:00", "10:30"]);
  });

  it("respects the earliest allowed start", () => {
    expect(clocks(request({ earliestStart: at("09:45") }))).toEqual(["10:00", "10:30"]);
  });

  it("aligns start times to the grid from midnight", () => {
    const req = request({
      stepMin: 15,
      staff: [{ staffId: 1, shifts: [{ startMin: 9 * 60 + 10, endMin: 10 * 60 }], busy: [] }],
    });
    expect(clocks(req)).toEqual(["09:15", "09:30"]);
  });

  it("merges staff and lists who is free at each time", () => {
    const req = request({
      staff: [
        { staffId: 1, shifts: [{ startMin: 540, endMin: 600 }], busy: [] },
        {
          staffId: 2,
          shifts: [{ startMin: 540, endMin: 630 }],
          busy: [{ start: at("09:00"), end: at("09:30") }],
        },
      ],
    });
    expect(computeSlots(req).map((slot) => slot.staffIds)).toEqual([[1], [1, 2], [2]]);
  });

  it("uses the right offset on both sides of a DST change", () => {
    // Israel/Palestine summer time ends on 2026-10-25.
    const summer = computeSlots(request({ date: "2026-10-24" }))[0].start;
    const winter = computeSlots(request({ date: "2026-10-26" }))[0].start;
    expect(new Date(summer).toISOString()).toBe("2026-10-24T06:00:00.000Z");
    expect(new Date(winter).toISOString()).toBe("2026-10-26T07:00:00.000Z");
    expect(winter - summer).toBe((2 * 24 + 1) * 60 * MINUTE);
  });
});

describe("validWeek", () => {
  it("accepts split shifts and rejects overlaps or backwards times", () => {
    expect(validWeek([
      { weekday: 0, startMin: 540, endMin: 780 },
      { weekday: 0, startMin: 840, endMin: 1140 },
    ])).toBe(true);
    expect(validWeek([
      { weekday: 0, startMin: 540, endMin: 780 },
      { weekday: 0, startMin: 700, endMin: 900 },
    ])).toBe(false);
    expect(validWeek([{ weekday: 1, startMin: 600, endMin: 600 }])).toBe(false);
    expect(validWeek([{ weekday: 7, startMin: 600, endMin: 700 }])).toBe(false);
  });
});

describe("slotPlan", () => {
  it("uses the real duration and buffer in service mode", () => {
    expect(slotPlan({ slotMode: "service", fixedSlotMin: 30, slotStepMin: 15 }, 40, 5)).toEqual({
      occupiedMin: 40,
      bufferMin: 5,
      stepMin: 15,
    });
  });

  it("rounds up to whole slots in fixed mode", () => {
    expect(slotPlan({ slotMode: "fixed", fixedSlotMin: 30, slotStepMin: 15 }, 40, 5)).toEqual({
      occupiedMin: 60,
      bufferMin: 0,
      stepMin: 30,
    });
  });
});
