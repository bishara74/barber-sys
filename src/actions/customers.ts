"use server";

import { and, eq, ne } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, customers } from "@/db/schema";
import { requireOwner, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/config";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";
import { normalizePhone } from "@/lib/phone";

const customerSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: fields.requiredText(80),
  phone: fields.requiredText(30),
  notes: fields.text(2000),
});

export async function saveCustomer(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = await parseForm(customerSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, name, notes } = parsed.data;

  const phone = normalizePhone(parsed.data.phone, (await getSettings()).phoneCountryCode);
  if (!phone) return failure("invalidPhone");

  const db = getDb();
  const taken = await db.query.customers.findFirst({ where: and(eq(customers.phone, phone), ne(customers.id, id)) });
  if (taken) return failure("phoneTaken");

  await db.update(customers).set({ name, phone, notes }).where(eq(customers.id, id));
  refresh();
  return success();
}

/** Removes the customer and their name and phone from past bookings (right to be forgotten). */
export async function deleteCustomer(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("id"));
  const t = await getTranslations("admin.customers");
  const db = getDb();

  await db.batch([
    db
      .update(bookings)
      .set({ customerName: t("deletedName"), customerPhone: "", customerNote: "", customerId: null })
      .where(eq(bookings.customerId, id)),
    db.delete(customers).where(eq(customers.id, id)),
  ]);
  redirect("/admin/customers");
}
