import { describe, expect, it } from "vitest";
import { quoteBooking, type QuoteGroup } from "./quote";

const service = { price: 5000, priceIsFrom: false, durationMin: 30, bufferMin: 5 };

const groups: QuoteGroup[] = [
  {
    id: 1,
    nameEn: "Add-ons",
    nameAr: "إضافات",
    selection: "multiple",
    isRequired: false,
    options: [
      { id: 10, nameEn: "Beard", nameAr: "لحية", priceDelta: 2000, durationDelta: 15 },
      { id: 11, nameEn: "Wash", nameAr: "غسيل", priceDelta: 1000, durationDelta: 10 },
    ],
  },
  {
    id: 2,
    nameEn: "Length",
    nameAr: "الطول",
    selection: "single",
    isRequired: true,
    options: [
      { id: 20, nameEn: "Short", nameAr: "قصير", priceDelta: 0, durationDelta: 0 },
      { id: 21, nameEn: "Long", nameAr: "طويل", priceDelta: 1500, durationDelta: 15 },
    ],
  },
];

describe("quoteBooking", () => {
  it("adds option prices and durations to the service", () => {
    const result = quoteBooking(service, groups, [10, 11, 21]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quote.price).toBe(9500);
    expect(result.quote.durationMin).toBe(70);
    expect(result.quote.bufferMin).toBe(5);
    expect(result.quote.options.map((option) => option.nameEn)).toEqual(["Beard", "Wash", "Long"]);
  });

  it("requires a choice in required groups", () => {
    expect(quoteBooking(service, groups, [10])).toEqual({
      ok: false,
      error: "missing_required",
      groupId: 2,
    });
  });

  it("allows only one choice in single groups", () => {
    expect(quoteBooking(service, groups, [20, 21])).toEqual({ ok: false, error: "too_many", groupId: 2 });
  });

  it("rejects options from other services", () => {
    expect(quoteBooking(service, groups, [20, 99])).toEqual({ ok: false, error: "unknown_option" });
  });

  it("keeps the price on request when the service has no price", () => {
    const result = quoteBooking({ ...service, price: null }, groups, [20, 10]);
    expect(result.ok && result.quote.price).toBeNull();
  });
});
