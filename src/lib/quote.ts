import type { BookedOption, OptionSelection } from "@/db/schema";

export type QuoteService = {
  price: number | null;
  priceIsFrom: boolean;
  durationMin: number;
  bufferMin: number;
};

export type QuoteOption = {
  id: number;
  nameEn: string;
  nameAr: string;
  priceDelta: number;
  durationDelta: number;
};

export type QuoteGroup = {
  id: number;
  nameEn: string;
  nameAr: string;
  selection: OptionSelection;
  isRequired: boolean;
  options: QuoteOption[];
};

export type Quote = {
  /** Null when the service price is "on request". */
  price: number | null;
  priceIsFrom: boolean;
  durationMin: number;
  bufferMin: number;
  options: BookedOption[];
};

export type QuoteResult =
  | { ok: true; quote: Quote }
  | { ok: false; error: "unknown_option" | "missing_required" | "too_many"; groupId?: number };

/** Validates the chosen options against the service's groups and totals price and duration. */
export function quoteBooking(
  service: QuoteService,
  groups: QuoteGroup[],
  optionIds: number[],
): QuoteResult {
  const chosen = new Set(optionIds);
  const known = new Set(groups.flatMap((group) => group.options.map((option) => option.id)));
  if ([...chosen].some((id) => !known.has(id))) return { ok: false, error: "unknown_option" };

  let price = service.price;
  let durationMin = service.durationMin;
  const booked: BookedOption[] = [];

  for (const group of groups) {
    const picked = group.options.filter((option) => chosen.has(option.id));
    if (group.isRequired && group.options.length > 0 && picked.length === 0) {
      return { ok: false, error: "missing_required", groupId: group.id };
    }
    if (group.selection === "single" && picked.length > 1) {
      return { ok: false, error: "too_many", groupId: group.id };
    }
    for (const option of picked) {
      if (price !== null) price += option.priceDelta;
      durationMin += option.durationDelta;
      booked.push({
        groupNameEn: group.nameEn,
        groupNameAr: group.nameAr,
        nameEn: option.nameEn,
        nameAr: option.nameAr,
        priceDelta: option.priceDelta,
        durationDelta: option.durationDelta,
      });
    }
  }

  return {
    ok: true,
    quote: {
      price: price === null ? null : Math.max(0, price),
      priceIsFrom: service.priceIsFrom,
      durationMin: Math.max(5, durationMin),
      bufferMin: service.bufferMin,
      options: booked,
    },
  };
}
