import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { getDb } from "@/db";
import { config } from "@/db/schema";

// Every field uses .catch(): a missing or invalid stored value falls back to the default,
// so adding a setting never needs a migration and old data never breaks a page.
const text = (fallback = "") => z.string().max(2000).catch(fallback);
const int = (min: number, max: number, fallback: number) =>
  z.coerce.number().int().min(min).max(max).catch(fallback);

export const SLOT_STEPS = [5, 10, 15, 20, 30, 60] as const;

export const settingsSchema = z.object({
  /** instant: bookings are confirmed right away. approval: they wait for the shop. */
  bookingMode: z.enum(["instant", "approval"]).catch("approval"),
  /** Hours an unapproved booking holds its slot before it expires. */
  pendingExpiryHours: int(1, 168, 12),
  /** service: each booking takes its real duration. fixed: every booking snaps to fixed slots. */
  slotMode: z.enum(["service", "fixed"]).catch("service"),
  fixedSlotMin: int(5, 240, 30),
  slotStepMin: z.coerce
    .number()
    .refine((n) => (SLOT_STEPS as readonly number[]).includes(n))
    .catch(15),
  minNoticeMin: int(0, 10080, 60),
  maxDaysAhead: int(1, 365, 30),
  /** Customers can cancel or reschedule online until this many hours before the start. */
  cancelWindowHours: int(0, 168, 3),
  maxActiveBookingsPerPhone: int(1, 20, 2),
  /** When off, customers cannot pick a staff member; the first free one is assigned. */
  allowStaffChoice: z.boolean().catch(true),
  phoneCountryCode: z.string().regex(/^\d{1,4}$/).catch("970"),
  currency: z.string().regex(/^[A-Z]{3}$/).catch("ILS"),
});

export type Settings = z.output<typeof settingsSchema>;

export const profileSchema = z.object({
  nameEn: text(),
  nameAr: text(),
  taglineEn: text(),
  taglineAr: text(),
  bioEn: text(),
  bioAr: text(),
  addressEn: text(),
  addressAr: text(),
  mapUrl: text(),
  /** Digits only, international format. */
  phone: text(),
  /** Digits only, international format. Booking confirmations go here. */
  whatsapp: text(),
  avatarKey: text(),
  coverKey: text(),
});

export type Profile = z.output<typeof profileSchema>;

type ConfigKey = "settings" | "profile";

async function readStored(key: ConfigKey): Promise<object> {
  const row = await getDb().query.config.findFirst({ where: eq(config.key, key) });
  return row?.value && typeof row.value === "object" ? row.value : {};
}

async function writeStored(key: ConfigKey, value: object) {
  await getDb()
    .insert(config)
    .values({ key, value })
    .onConflictDoUpdate({ target: config.key, set: { value } });
}

export const getSettings = cache(async () => settingsSchema.parse(await readStored("settings")));
export const getProfile = cache(async () => profileSchema.parse(await readStored("profile")));

export async function saveSettings(changes: Partial<Settings>) {
  await writeStored("settings", settingsSchema.parse({ ...(await getSettings()), ...changes }));
}

export async function saveProfile(changes: Partial<Profile>) {
  await writeStored("profile", profileSchema.parse({ ...(await getProfile()), ...changes }));
}
