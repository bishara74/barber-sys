import { describe, expect, it } from "vitest";
import { openingStatus } from "./opening";

const h = (hours: number) => hours * 60;
// Sunday to Thursday 09-13 and 14-20, Friday closed, Saturday 10-18.
const weekly = [
  ...Array.from({ length: 5 }, () => [
    { startMin: h(9), endMin: h(13) },
    { startMin: h(14), endMin: h(20) },
  ]),
  [],
  [{ startMin: h(10), endMin: h(18) }],
];

describe("openingStatus", () => {
  it("is open inside a shift, until that shift ends", () => {
    expect(openingStatus(weekly, 1, h(10))).toEqual({ open: true, until: h(13) });
    expect(openingStatus(weekly, 1, h(14))).toEqual({ open: true, until: h(20) });
  });

  it("reopens after a break on the same day", () => {
    expect(openingStatus(weekly, 1, h(13) + 30)).toEqual({
      open: false,
      next: { inDays: 0, weekday: 1, at: h(14) },
    });
  });

  it("skips closed days", () => {
    expect(openingStatus(weekly, 4, h(21))).toEqual({ open: false, next: { inDays: 2, weekday: 6, at: h(10) } });
  });

  it("is closed at the exact end of a shift", () => {
    expect(openingStatus(weekly, 6, h(18)).open).toBe(false);
  });

  it("has no next opening when there are no hours at all", () => {
    expect(openingStatus(Array.from({ length: 7 }, () => []), 0, h(12))).toEqual({ open: false, next: null });
  });
});
