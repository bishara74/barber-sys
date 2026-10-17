import { describe, expect, it } from "vitest";
import { parseMoney } from "./money";
import { normalizePhone, whatsappLink } from "./phone";
import { parseClock, parseLocalDateTime, toLocalDateTime } from "./time";

describe("normalizePhone", () => {
  it.each([
    ["0591234567", "970591234567"],
    ["059-123-4567", "970591234567"],
    ["591234567", "970591234567"],
    ["+972 52 123 4567", "972521234567"],
    ["00970591234567", "970591234567"],
    ["970591234567", "970591234567"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input, "970")).toBe(expected);
  });

  it("rejects numbers that are too short or empty", () => {
    expect(normalizePhone("12345", "970")).toBeNull();
    expect(normalizePhone("abc", "970")).toBeNull();
  });

  it("builds wa.me links with an encoded message", () => {
    expect(whatsappLink("970591234567", "Hi & bye")).toBe("https://wa.me/970591234567?text=Hi%20%26%20bye");
  });

  it("opens a plain chat when there is no message", () => {
    expect(whatsappLink("970591234567", "")).toBe("https://wa.me/970591234567");
  });
});

describe("parseMoney", () => {
  it("parses whole and decimal amounts to minor units", () => {
    expect(parseMoney("45")).toBe(4500);
    expect(parseMoney("45.5")).toBe(4550);
    expect(parseMoney("12,25")).toBe(1225);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNaN();
  });
});

describe("clock and datetime helpers", () => {
  it("parses clock values", () => {
    expect(parseClock("09:30")).toBe(570);
    expect(parseClock("24:00")).toBe(1440);
    expect(parseClock("25:00")).toBeNull();
  });

  it("round-trips datetime-local values through a time zone", () => {
    const ms = parseLocalDateTime("2026-10-14T09:30", "Asia/Jerusalem");
    expect(ms).not.toBeNull();
    expect(toLocalDateTime(ms!, "Asia/Jerusalem")).toBe("2026-10-14T09:30");
  });
});
