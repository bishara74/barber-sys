import { describe, expect, it } from "vitest";
import { layoutLanes } from "./lanes";

const lanesOf = (items: { start: number; end: number; id: string }[]) =>
  Object.fromEntries(layoutLanes(items).map((item) => [item.id, [item.lane, item.lanes]]));

describe("layoutLanes", () => {
  it("keeps separate events full width", () => {
    expect(lanesOf([
      { id: "a", start: 0, end: 10 },
      { id: "b", start: 10, end: 20 },
    ])).toEqual({ a: [0, 1], b: [0, 1] });
  });

  it("puts overlapping events side by side", () => {
    expect(lanesOf([
      { id: "a", start: 0, end: 30 },
      { id: "b", start: 10, end: 20 },
      { id: "c", start: 20, end: 40 },
    ])).toEqual({ a: [0, 2], b: [1, 2], c: [1, 2] });
  });

  it("starts a new group after a gap", () => {
    expect(lanesOf([
      { id: "a", start: 0, end: 30 },
      { id: "b", start: 10, end: 20 },
      { id: "c", start: 30, end: 40 },
    ])).toEqual({ a: [0, 2], b: [1, 2], c: [0, 1] });
  });
});
