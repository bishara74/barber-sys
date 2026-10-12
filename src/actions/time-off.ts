"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { timeOff } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";

const timeOffSchema = z.object({
  staffId: fields.optionalId,
  startsAt: fields.dateTime,
  endsAt: fields.dateTime,
  reason: fields.text(200),
});

export async function addTimeOff(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = await parseForm(timeOffSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { staffId, startsAt, endsAt, reason } = parsed.data;

  // Staff accounts can only block their own time, never the whole shop.
  if (user.role !== "owner" && (staffId === null || staffId !== user.staffId)) return failure("notFound");
  if (endsAt <= startsAt) return failure("invalidRange");

  await getDb()
    .insert(timeOff)
    .values({ staffId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), reason });
  refresh();
  return success();
}

export async function deleteTimeOff(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const row = await getDb().query.timeOff.findFirst({ where: eq(timeOff.id, id) });
  if (!row || (user.role !== "owner" && (row.staffId === null || row.staffId !== user.staffId))) return;

  await getDb().delete(timeOff).where(eq(timeOff.id, id));
  refresh();
}
