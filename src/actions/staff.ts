"use server";

import { count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, services, staff, staffServices, workingHours } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { validWeek } from "@/lib/availability";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";
import { deleteImages, replaceImage } from "@/lib/media";
import { nextSortOrder } from "@/lib/sort";

const createSchema = z.object({ name: fields.requiredText(80) });

/** New staff members can do every service and start with the same hours as the first colleague. */
export async function createStaff(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(createSchema, formData);
  if (!parsed.ok) return parsed.state;
  const db = getDb();

  const [member] = await db
    .insert(staff)
    .values({ name: parsed.data.name, sortOrder: await nextSortOrder(staff) })
    .returning({ id: staff.id });

  const [serviceRows, colleague] = await Promise.all([
    db.select({ id: services.id }).from(services).where(eq(services.isArchived, false)),
    db.query.staff.findFirst({ where: (row, { ne }) => ne(row.id, member.id), orderBy: (row, { asc }) => asc(row.sortOrder) }),
  ]);
  if (serviceRows.length > 0) {
    await db.insert(staffServices).values(serviceRows.map((service) => ({ staffId: member.id, serviceId: service.id })));
  }
  if (colleague) {
    const hours = await db.select().from(workingHours).where(eq(workingHours.staffId, colleague.id));
    if (hours.length > 0) {
      await db
        .insert(workingHours)
        .values(hours.map(({ weekday, startMin, endMin }) => ({ staffId: member.id, weekday, startMin, endMin })));
    }
  }
  redirect(`/admin/staff/${member.id}`);
}

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: fields.requiredText(80),
  isActive: fields.checkbox,
  serviceIds: fields.ids,
  removeAvatar: fields.checkbox,
});

export async function updateStaff(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(updateSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, name, isActive, serviceIds, removeAvatar } = parsed.data;
  const db = getDb();

  const member = await db.query.staff.findFirst({ where: eq(staff.id, id) });
  if (!member) return failure("notFound");

  let avatarKey: string | null;
  try {
    avatarKey = await replaceImage(member.avatarKey, formData.get("avatar"), removeAvatar, "staff");
  } catch (error) {
    console.error(error);
    return failure("imageFailed");
  }

  await db.update(staff).set({ name, isActive, avatarKey }).where(eq(staff.id, id));
  await db.delete(staffServices).where(eq(staffServices.staffId, id));
  if (serviceIds.length > 0) {
    await db.insert(staffServices).values(serviceIds.map((serviceId) => ({ staffId: id, serviceId })));
  }
  refresh();
  return success();
}

const shiftSchema = z.object({
  weekday: z.number().int(),
  startMin: z.number().int(),
  endMin: z.number().int(),
});

const hoursSchema = z.object({
  id: z.coerce.number().int().positive(),
  hours: z.string().transform((value, ctx) => {
    try {
      return z.array(shiftSchema).parse(JSON.parse(value));
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid hours" });
      return z.NEVER;
    }
  }),
});

export async function saveHours(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(hoursSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, hours } = parsed.data;
  if (!validWeek(hours)) return failure("invalidShifts");

  const db = getDb();
  await db.delete(workingHours).where(eq(workingHours.staffId, id));
  if (hours.length > 0) {
    await db.insert(workingHours).values(hours.map((shift) => ({ ...shift, staffId: id })));
  }
  refresh();
  return success();
}

/** Only people without bookings can be deleted; others are switched off instead. */
export async function deleteStaff(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const id = Number(formData.get("id"));
  const db = getDb();
  const [used] = await db.select({ total: count() }).from(bookings).where(eq(bookings.staffId, id));
  if (used.total > 0) return failure("hasBookings");

  const [member] = await db.delete(staff).where(eq(staff.id, id)).returning();
  await deleteImages([member?.avatarKey]);
  redirect("/admin/staff");
}
