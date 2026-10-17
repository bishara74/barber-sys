"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { saveSettings as storeSettings, SLOT_STEPS } from "@/lib/config";
import { fields, parseForm, success, type ActionState } from "@/lib/forms";

const settingsForm = z.object({
  bookingMode: z.enum(["instant", "approval"]),
  pendingExpiryHours: fields.int(1, 168),
  allowStaffChoice: fields.checkbox,
  slotMode: z.enum(["service", "fixed"]),
  fixedSlotMin: fields.int(5, 240),
  slotStepMin: z.coerce.number().refine((n) => (SLOT_STEPS as readonly number[]).includes(n)),
  minNoticeMin: fields.int(0, 10080),
  maxDaysAhead: fields.int(1, 365),
  cancelWindowHours: fields.int(0, 168),
  maxActiveBookingsPerPhone: fields.int(1, 20),
  phoneCountryCode: z.string().trim().regex(/^\d{1,4}$/),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
});

export async function saveSettings(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(settingsForm, formData);
  if (!parsed.ok) return parsed.state;
  await storeSettings(parsed.data);
  refresh();
  return success();
}
