"use server";

import { and, count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, optionGroups, options, services, serviceTypes, staffServices } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";
import { nextSortOrder } from "@/lib/sort";

/** At least one of the two names must be filled in. */
const names = {
  nameEn: fields.text(120),
  nameAr: fields.text(120),
};
const hasName = (value: { nameEn: string; nameAr: string }) => Boolean(value.nameEn || value.nameAr);
const nameIssue = { path: ["nameEn"], error: "Name required" };

// Service types

const typeSchema = z
  .object({ id: fields.optionalId, ...names, isVisible: fields.checkbox })
  .refine(hasName, nameIssue);

export async function saveServiceType(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(typeSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...values } = parsed.data;

  const db = getDb();
  if (id) await db.update(serviceTypes).set(values).where(eq(serviceTypes.id, id));
  else await db.insert(serviceTypes).values({ ...values, sortOrder: await nextSortOrder(serviceTypes) });
  refresh();
  return success();
}

export async function deleteServiceType(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const id = Number(formData.get("id"));
  const db = getDb();
  const [used] = await db.select({ total: count() }).from(services).where(eq(services.typeId, id));
  if (used.total > 0) return failure("typeNotEmpty");

  await db.delete(serviceTypes).where(eq(serviceTypes.id, id));
  refresh();
  return success("deleted");
}

// Services

const serviceSchema = z
  .object({
    id: fields.optionalId,
    typeId: z.coerce.number().int().positive(),
    ...names,
    descriptionEn: fields.text(1000),
    descriptionAr: fields.text(1000),
    price: fields.money,
    priceIsFrom: fields.checkbox,
    durationMin: fields.int(5, 24 * 60),
    bufferMin: fields.int(0, 240),
    bookableOnline: fields.checkbox,
    isVisible: fields.checkbox,
    staffIds: fields.ids,
  })
  .refine(hasName, nameIssue);

export async function saveService(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(serviceSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, staffIds, ...values } = parsed.data;
  const db = getDb();

  let serviceId = id;
  if (serviceId) {
    await db.update(services).set(values).where(eq(services.id, serviceId));
  } else {
    const sortOrder = await nextSortOrder(services, eq(services.typeId, values.typeId));
    const [created] = await db.insert(services).values({ ...values, sortOrder }).returning({ id: services.id });
    serviceId = created.id;
  }

  await db.delete(staffServices).where(eq(staffServices.serviceId, serviceId));
  if (staffIds.length > 0) {
    await db.insert(staffServices).values(staffIds.map((staffId) => ({ staffId, serviceId })));
  }

  if (!id) redirect(`/admin/services/${serviceId}`);
  refresh();
  return success();
}

export async function setServiceArchived(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("id"));
  const isArchived = formData.get("archived") === "true";
  await getDb().update(services).set({ isArchived }).where(eq(services.id, id));
  redirect("/admin/services");
}

/** Services with bookings are archived instead, so booking history keeps its link. */
export async function deleteService(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const id = Number(formData.get("id"));
  const db = getDb();
  const [used] = await db.select({ total: count() }).from(bookings).where(eq(bookings.serviceId, id));
  if (used.total > 0) return failure("hasBookings");

  await db.delete(services).where(eq(services.id, id));
  redirect("/admin/services");
}

// Option groups and options

const groupSchema = z
  .object({
    id: fields.optionalId,
    serviceId: z.coerce.number().int().positive(),
    ...names,
    selection: z.enum(["single", "multiple"]),
    isRequired: fields.checkbox,
  })
  .refine(hasName, nameIssue);

export async function saveOptionGroup(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(groupSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...values } = parsed.data;
  const db = getDb();

  if (id) {
    await db
      .update(optionGroups)
      .set(values)
      .where(and(eq(optionGroups.id, id), eq(optionGroups.serviceId, values.serviceId)));
  } else {
    const sortOrder = await nextSortOrder(optionGroups, eq(optionGroups.serviceId, values.serviceId));
    await db.insert(optionGroups).values({ ...values, sortOrder });
  }
  refresh();
  return success();
}

export async function deleteOptionGroup(formData: FormData) {
  await requireOwner();
  await getDb().delete(optionGroups).where(eq(optionGroups.id, Number(formData.get("id"))));
  refresh();
}

const optionSchema = z
  .object({
    id: fields.optionalId,
    groupId: z.coerce.number().int().positive(),
    ...names,
    priceDelta: fields.requiredMoney,
    durationDelta: fields.int(-240, 24 * 60),
  })
  .refine(hasName, nameIssue);

export async function saveOption(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(optionSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...values } = parsed.data;
  const db = getDb();

  if (id) {
    await db.update(options).set(values).where(and(eq(options.id, id), eq(options.groupId, values.groupId)));
  } else {
    const sortOrder = await nextSortOrder(options, eq(options.groupId, values.groupId));
    await db.insert(options).values({ ...values, sortOrder });
  }
  refresh();
  return success();
}

export async function deleteOption(formData: FormData) {
  await requireOwner();
  await getDb().delete(options).where(eq(options.id, Number(formData.get("id"))));
  refresh();
}
