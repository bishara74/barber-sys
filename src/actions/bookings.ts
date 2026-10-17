"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings } from "@/db/schema";
import { canManageStaffBookings, requireUser } from "@/lib/auth";
import {
  approveBooking,
  canChangeStatus,
  findBooking,
  placeShopBooking,
  rescheduleByShop,
  setBookingStatus,
} from "@/lib/bookings";
import { getActiveStaff } from "@/lib/catalog";
import { getSettings } from "@/lib/config";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";

/** The booking, if the signed-in user may manage it. */
async function managedBooking(id: number) {
  const user = await requireUser();
  const booking = await findBooking(id);
  return booking && canManageStaffBookings(user, booking.staffId) ? booking : null;
}

const statusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["confirmed", "declined", "cancelled", "completed", "no_show"]),
});

export async function changeBookingStatus(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = await parseForm(statusSchema, formData);
  if (!parsed.ok) return parsed.state;
  const booking = await managedBooking(parsed.data.id);
  if (!booking) return failure("notFound");
  if (!canChangeStatus(booking.status, parsed.data.status)) return failure("statusChanged");

  if (parsed.data.status === "confirmed") {
    const result = await approveBooking(booking);
    if (!result.ok) return failure(result.error);
  } else {
    await setBookingStatus(booking.id, parsed.data.status);
  }
  refresh();
  return success();
}

const noteSchema = z.object({ id: z.coerce.number().int().positive(), staffNote: fields.text(2000) });

export async function saveStaffNote(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = await parseForm(noteSchema, formData);
  if (!parsed.ok) return parsed.state;
  const booking = await managedBooking(parsed.data.id);
  if (!booking) return failure("notFound");

  await getDb()
    .update(bookings)
    .set({ staffNote: parsed.data.staffNote, updatedAt: new Date() })
    .where(eq(bookings.id, booking.id));
  return success();
}

const moveSchema = z.object({
  id: z.coerce.number().int().positive(),
  staffId: z.coerce.number().int().positive(),
  startsAt: fields.dateTime,
});

export async function moveBooking(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = await parseForm(moveSchema, formData);
  if (!parsed.ok) return parsed.state;
  const booking = await managedBooking(parsed.data.id);
  if (!booking || !canManageStaffBookings(user, parsed.data.staffId)) return failure("notFound");

  const result = await rescheduleByShop(booking, parsed.data.staffId, parsed.data.startsAt);
  if (!result.ok) return failure(result.error);
  refresh();
  return success();
}

const shopBookingSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  optionIds: fields.ids,
  staffId: z.coerce.number().int().positive(),
  startsAt: fields.dateTime,
  name: fields.requiredText(80),
  phone: fields.text(30),
  note: fields.text(500),
  source: z.enum(["admin", "walk_in"]),
});

export async function createShopBooking(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = await parseForm(shopBookingSchema, formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.data;

  const staff = await getActiveStaff();
  if (!staff.some((member) => member.id === input.staffId) || !canManageStaffBookings(user, input.staffId)) {
    return failure("notFound");
  }

  const result = await placeShopBooking(input, await getSettings());
  if (!result.ok) return failure(result.error);
  redirect(`/admin/bookings/${result.id}`);
}
