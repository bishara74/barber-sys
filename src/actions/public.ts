"use server";

import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale, LOCALE_COOKIE } from "@/i18n/locales";
import {
  customerCanChange,
  findBookingByToken,
  placeOnlineBooking,
  rescheduleByCustomer,
  setBookingStatus,
} from "@/lib/bookings";
import { getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { verifyTurnstile } from "@/lib/turnstile";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

const bookingInput = z.object({
  serviceId: z.number().int().positive(),
  optionIds: z.array(z.number().int().positive()).max(50),
  staffId: z.number().int().positive().nullable(),
  startsAt: z.number().int().positive(),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  note: z.string().trim().max(500),
  turnstileToken: z.string().nullable(),
});

export type CreateBookingResult = { ok: true; token: string } | { ok: false; error: string };

export async function createBooking(input: z.input<typeof bookingInput>): Promise<CreateBookingResult> {
  const t = await getTranslations("errors");
  const parsed = bookingInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("checkFields") };

  const { turnstileToken, ...booking } = parsed.data;
  if (!(await verifyTurnstile(turnstileToken))) return { ok: false, error: t("botCheck") };

  const result = await placeOnlineBooking(booking, await getSettings(), getDeploymentConfig().timeZone);
  return result.ok ? { ok: true, token: result.token } : { ok: false, error: t(result.error) };
}

export async function rescheduleBooking(token: string, startsAt: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = await getTranslations("errors");
  const booking = await findBookingByToken(token);
  if (!booking) return { ok: false, error: t("notFound") };

  const result = await rescheduleByCustomer(booking, startsAt, await getSettings(), getDeploymentConfig().timeZone);
  return result.ok ? { ok: true } : { ok: false, error: t(result.error) };
}

export async function cancelBooking(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const booking = await findBookingByToken(token);
  if (booking && customerCanChange(booking, await getSettings(), Date.now())) {
    await setBookingStatus(booking.id, "cancelled");
  }
  redirect(`/booking/${encodeURIComponent(token)}`);
}
