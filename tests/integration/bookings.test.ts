import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { cancelBooking, rescheduleBooking } from "@/actions/public";
import { getDb } from "@/db";
import { bookings, customers, options, services, timeOff } from "@/db/schema";
import {
  approveBooking, customerCanChange, effectiveStatus, findBookingByToken,
  placeOnlineBooking, rescheduleByCustomer, rescheduleByShop, setBookingStatus,
  slotsForNewBooking,
} from "@/lib/bookings";
import { saveSettings, settingsSchema, type Settings } from "@/lib/config";
import { getBookingDays } from "@/lib/schedule";
import { addDays, HOUR, MINUTE, zonedTime } from "@/lib/time";
import { resetDatabase, startDatabase, stopDatabase, TIME_ZONE } from "./d1";

const DATE = "2026-10-14"; // Wednesday; fixtures also include a lunch break and a closed Friday.
const at = (hour: number, minute = 0, date = DATE) => zonedTime(date, hour * 60 + minute, TIME_ZONE);
const NOW = at(8, 0, "2026-10-13");
let settings: Settings;
let identity = 0;

function input(overrides: Partial<Parameters<typeof placeOnlineBooking>[0]> = {}) {
  identity++;
  return {
    serviceId: 1, optionIds: [1], staffId: 1, startsAt: at(9),
    name: `Customer ${identity}`, phone: `059${String(identity).padStart(7, "0")}`, note: "Test note",
    ...overrides,
  };
}
const place = (overrides: Parameters<typeof input>[0] = {}) => placeOnlineBooking(input(overrides), settings, TIME_ZONE);
const slots = (date = DATE, staffId: number | null = 1) =>
  slotsForNewBooking({ serviceId: 1, optionIds: [1], staffId, date }, settings, TIME_ZONE);
async function create(overrides: Parameters<typeof input>[0] = {}) {
  const result = await place(overrides);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return read(result.token);
}
async function read(token: string) {
  const booking = await findBookingByToken(token);
  expect(booking).toBeDefined();
  return booking!;
}
async function cancel(token: string) {
  const data = new FormData();
  data.set("token", token);
  await expect(cancelBooking(data)).rejects.toThrow(`redirect:/booking/${token}`);
}

beforeAll(startDatabase);
afterAll(stopDatabase);
beforeEach(async () => {
  await resetDatabase();
  vi.spyOn(Date, "now").mockReturnValue(NOW);
  settings = settingsSchema.parse({});
});
afterEach(() => vi.restoreAllMocks());

describe("booking creation and schedule against D1", () => {
  it("creates a pending booking inside a shift and stores customer details", async () => {
    const booking = await create();
    expect(booking).toMatchObject({ status: "pending", source: "online", customerNote: "Test note", staffId: 1 });
    expect(booking.startsAt.getTime()).toBe(at(9));
    expect(booking.pendingExpiresAt?.getTime()).toBe(NOW + 12 * HOUR);
    expect(await getDb().select().from(customers)).toHaveLength(1);
  });

  it.each([[8, 45], [13, 0], [13, 45], [19, 45], [20, 0]])("rejects %i:%i outside a complete working shift", async (hour, minute) => {
    expect(await place({ startsAt: at(hour, minute) })).toEqual({ ok: false, error: "slotTaken" });
    expect(await getDb().select().from(bookings)).toHaveLength(0);
  });

  it("rejects appointments in the past", async () => {
    expect(await place({ startsAt: at(9, 0, "2026-10-12") })).toEqual({ ok: false, error: "slotTaken" });
  });

  it.each([1, null])("respects staff/shop time off (%s)", async (staffId) => {
    await getDb().insert(timeOff).values({ staffId, startsAt: new Date(at(10)), endsAt: new Date(at(11)) });
    expect(await place({ startsAt: at(10) })).toEqual({ ok: false, error: "slotTaken" });
    if (staffId !== null) expect((await place({ staffId: 2, startsAt: at(10) })).ok).toBe(true);
    else expect(await place({ staffId: 2, startsAt: at(10) })).toEqual({ ok: false, error: "slotTaken" });
    expect((await slots()).some((slot) => slot.start === at(11))).toBe(true);
  });

  it("has no slots in the lunch gap or on Friday, and marks full closures closed", async () => {
    const available = await slots();
    expect(available.some((slot) => slot.start === at(12, 30))).toBe(true);
    expect(available.filter((slot) => slot.start >= at(13) && slot.start < at(14))).toEqual([]);
    expect(available.some((slot) => slot.start === at(14))).toBe(true);
    const friday = "2026-10-16";
    expect(await slots(friday)).toEqual([]);
    await getDb().insert(timeOff).values({ startsAt: new Date(at(0)), endsAt: new Date(at(0, 0, addDays(DATE, 1))) });
    const days = await getBookingDays(settings, TIME_ZONE, NOW);
    expect(days.find((day) => day.date === DATE)?.open).toBe(false);
    expect(days.find((day) => day.date === friday)?.open).toBe(false);
  });

  it("rejects sequential overlapping bookings, including buffers", async () => {
    await create();
    for (const startsAt of [at(9), at(9, 15), at(9, 30)]) {
      expect(await place({ startsAt })).toEqual({ ok: false, error: "slotTaken" });
    }
    expect((await place({ startsAt: at(9, 45) })).ok).toBe(true);
    expect(await getDb().select().from(bookings)).toHaveLength(2);
  });

  it.each([0, 15])("allows exactly one simultaneous request with a %i-minute start difference", async (minute) => {
    const results = await Promise.all([place(), place({ startsAt: at(9, minute) })]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([{ ok: false, error: "slotTaken" }]);
    expect(await getDb().select().from(bookings)).toHaveLength(1);
  });

  it("stores option price/duration snapshots and respects the buffer", async () => {
    const booking = await create({ optionIds: [2, 3] });
    expect(booking).toMatchObject({ price: 7500, durationMin: 60, serviceNameEn: "Haircut" });
    expect(booking.endsAt.getTime()).toBe(at(10));
    expect(booking.blockedUntil.getTime()).toBe(at(10, 15));
    expect(booking.options.map((option) => [option.nameEn, option.priceDelta, option.durationDelta]))
      .toEqual([["Long", 1000, 15], ["Beard", 1500, 15]]);
    expect(await place({ startsAt: at(10) })).toEqual({ ok: false, error: "slotTaken" });
    expect((await place({ startsAt: at(10, 15) })).ok).toBe(true);
    await getDb().update(services).set({ price: 9999, durationMin: 90, nameEn: "Renamed" }).where(eq(services.id, 1));
    await getDb().update(options).set({ nameEn: "Changed", priceDelta: 9000, durationDelta: 60 });
    const snapshot = await read(booking.token);
    expect(snapshot).toMatchObject({ price: 7500, durationMin: 60, serviceNameEn: "Haircut", options: booking.options });
    expect(snapshot.endsAt).toEqual(booking.endsAt);
  });

  it("rounds fixed slots while preserving the actual quoted duration", async () => {
    settings.slotMode = "fixed";
    const booking = await create({ optionIds: [2] });
    expect(booking.durationMin).toBe(45);
    expect(booking.endsAt.getTime()).toBe(at(10));
    expect(booking.blockedUntil).toEqual(booking.endsAt);
    expect((await place({ startsAt: at(10) })).ok).toBe(true);
  });

  it("assigns anyone available to a genuinely free eligible staff member", async () => {
    await create();
    const booking = await create({ staffId: null });
    expect(booking.staffId).toBe(2);
    expect(await place({ staffId: null })).toEqual({ ok: false, error: "slotTaken" });
  });

  it("enforces minimum notice at the exact boundary", async () => {
    vi.mocked(Date.now).mockReturnValue(at(8));
    expect(await place({ startsAt: at(9) - 15 * MINUTE })).toEqual({ ok: false, error: "slotTaken" });
    expect((await place()).ok).toBe(true);
    await getDb().delete(bookings);
    vi.mocked(Date.now).mockReturnValue(at(8) + 1);
    expect(await place()).toEqual({ ok: false, error: "slotTaken" });
  });

  it("includes the final horizon date and excludes the next day", async () => {
    settings.maxDaysAhead = 1;
    expect((await place()).ok).toBe(true);
    expect(await place({ startsAt: at(9, 0, addDays(DATE, 1)) })).toEqual({ ok: false, error: "slotTaken" });
  });

  it("normalizes equivalent phones, rejects a third booking, and releases cancelled capacity", async () => {
    const first = await create({ phone: "0591234567" });
    await create({ phone: "+970 59 123 4567", startsAt: at(10) });
    expect(await place({ phone: "00970591234567", startsAt: at(11) })).toEqual({ ok: false, error: "tooManyBookings" });
    const rows = await getDb().select().from(bookings);
    expect(rows.map((row) => row.customerPhone)).toEqual(["970591234567", "970591234567"]);
    expect(await getDb().select().from(customers)).toHaveLength(1);
    await setBookingStatus(first.id, "cancelled");
    expect((await place({ phone: "970591234567", startsAt: at(11) })).ok).toBe(true);
  });

  it.each(["abc", "12345"])("rejects invalid phone %s without storing a booking", async (phone) => {
    expect(await place({ phone })).toEqual({ ok: false, error: "invalidPhone" });
    expect(await getDb().select().from(bookings)).toHaveLength(0);
  });
});

describe("booking lifecycle and private actions", () => {
  it("confirms instant bookings without a pending expiry", async () => {
    settings.bookingMode = "instant";
    expect(await create()).toMatchObject({ status: "confirmed", pendingExpiresAt: null });
  });

  it("holds pending slots, approves them, and releases declined slots", async () => {
    const first = await create();
    expect(await place()).toEqual({ ok: false, error: "slotTaken" });
    expect(await approveBooking(first)).toEqual({ ok: true });
    expect(await read(first.token)).toMatchObject({ status: "confirmed", pendingExpiresAt: null });
    const second = await create({ startsAt: at(10) });
    await setBookingStatus(second.id, "declined");
    expect((await read(second.token)).status).toBe("declined");
    expect((await place({ startsAt: at(10) })).ok).toBe(true);
  });

  it("frees expired holds at the deadline without a cron update or phone-limit penalty", async () => {
    settings.maxActiveBookingsPerPhone = 1;
    const booking = await create({ phone: "0591234567" });
    const expires = booking.pendingExpiresAt!.getTime();
    vi.mocked(Date.now).mockReturnValue(expires - 1);
    expect(effectiveStatus(booking, Date.now())).toBe("pending");
    expect((await slots()).some((slot) => slot.start === at(9))).toBe(false);
    vi.mocked(Date.now).mockReturnValue(expires);
    expect(effectiveStatus(booking, Date.now())).toBe("expired");
    expect((await slots()).some((slot) => slot.start === at(9))).toBe(true);
    await create({ phone: "0591234567" });
    expect(await approveBooking(booking)).toEqual({ ok: false, error: "slotTaken" });
    expect((await read(booking.token)).status).toBe("pending");
  });

  it("reschedules by private token back to pending, then cancels and frees the new slot", async () => {
    const booking = await create();
    await approveBooking(booking);
    await saveSettings(settings);
    vi.mocked(Date.now).mockReturnValue(NOW + HOUR);
    expect(await rescheduleBooking(booking.token, at(10))).toEqual({ ok: true });
    const moved = await read(booking.token);
    expect(moved).toMatchObject({ status: "pending", price: booking.price, durationMin: booking.durationMin });
    expect(moved.startsAt.getTime()).toBe(at(10));
    expect(moved.pendingExpiresAt?.getTime()).toBe(NOW + 13 * HOUR);
    expect((await slots()).some((slot) => slot.start === at(9))).toBe(true);
    await cancel(booking.token);
    expect((await read(booking.token)).status).toBe("cancelled");
    expect((await place({ startsAt: at(10) })).ok).toBe(true);
  });

  it("rejects wrong tokens without changing the legitimate booking", async () => {
    const booking = await create();
    expect(await findBookingByToken("wrong-token")).toBeUndefined();
    expect(await rescheduleBooking("wrong-token", at(10))).toEqual({ ok: false, error: "notFound" });
    await cancel("wrong-token");
    expect(await read(booking.token)).toEqual(booking);
  });

  it("allows changes at the cancellation boundary and refuses them one millisecond later", async () => {
    settings.bookingMode = "instant";
    const booking = await create();
    await saveSettings(settings);
    vi.mocked(Date.now).mockReturnValue(at(6));
    expect(customerCanChange(booking, settings, Date.now())).toBe(true);
    vi.mocked(Date.now).mockReturnValue(at(6) + 1);
    expect(await rescheduleBooking(booking.token, at(10))).toEqual({ ok: false, error: "notChangeable" });
    await cancel(booking.token);
    expect((await read(booking.token)).status).toBe("confirmed");
    vi.mocked(Date.now).mockReturnValue(at(6));
    await cancel(booking.token);
    expect((await read(booking.token)).status).toBe("cancelled");
  });

  it("refuses customer and shop moves onto an occupied slot", async () => {
    const booking = await create();
    await create({ startsAt: at(10) });
    expect(await rescheduleByCustomer(booking, at(10), settings, TIME_ZONE)).toEqual({ ok: false, error: "slotTaken" });
    expect(await rescheduleByShop(booking, 1, at(10))).toEqual({ ok: false, error: "slotTaken" });
    expect(await read(booking.token)).toEqual(booking);
  });
});
