"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { links, SOCIAL_PLATFORMS } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import {
  getProfile,
  getSettings,
  saveDesign as storeDesign,
  saveProfile as storeProfile,
  type Profile,
} from "@/lib/config";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";
import { replaceImage } from "@/lib/media";
import { normalizePhone } from "@/lib/phone";
import { nextSortOrder } from "@/lib/sort";
import { HEX_COLOR, THEME_NAMES } from "@/lib/theme";

const phone = fields.text(30);

const profileSchema = z.object({
  nameEn: fields.text(120),
  nameAr: fields.text(120),
  taglineEn: fields.text(200),
  taglineAr: fields.text(200),
  bioEn: fields.text(2000),
  bioAr: fields.text(2000),
  addressEn: fields.text(200),
  addressAr: fields.text(200),
  mapUrl: z.union([z.literal(""), z.url()]),
  phone,
  whatsapp: phone,
  removeAvatar: fields.checkbox,
  removeCover: fields.checkbox,
});

export async function saveProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(profileSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { removeAvatar, removeCover, ...values } = parsed.data;

  const { phoneCountryCode } = await getSettings();
  const phones: Pick<Profile, "phone" | "whatsapp"> = { phone: "", whatsapp: "" };
  for (const key of ["phone", "whatsapp"] as const) {
    if (!values[key]) continue;
    const normalized = normalizePhone(values[key], phoneCountryCode);
    if (!normalized) return failure("invalidPhone");
    phones[key] = normalized;
  }

  const current = await getProfile();
  try {
    const avatarKey = await replaceImage(current.avatarKey, formData.get("avatar"), removeAvatar, "profile");
    const coverKey = await replaceImage(current.coverKey, formData.get("cover"), removeCover, "profile");
    await storeProfile({ ...values, ...phones, avatarKey: avatarKey ?? "", coverKey: coverKey ?? "" });
  } catch (error) {
    console.error(error);
    return failure("imageFailed");
  }
  refresh();
  return success();
}

const colorOverride = z.union([z.literal(""), z.string().regex(HEX_COLOR)]);

const designSchema = z.object({
  theme: z.enum(THEME_NAMES),
  primary: colorOverride,
  accent: colorOverride,
});

export async function saveDesign(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(designSchema, formData);
  if (!parsed.ok) return parsed.state;
  await storeDesign(parsed.data);
  refresh();
  return success();
}

const linkSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("social"),
    id: fields.optionalId,
    platform: z.enum(SOCIAL_PLATFORMS),
    url: fields.requiredText(500),
    isVisible: fields.checkbox,
  }),
  z.object({
    kind: z.literal("button"),
    id: fields.optionalId,
    labelEn: fields.text(80),
    labelAr: fields.text(80),
    url: z.url().max(500),
    isVisible: fields.checkbox,
  }),
]);

export async function saveLink(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(linkSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...values } = parsed.data;
  const db = getDb();

  if (values.kind === "button" && !values.labelEn && !values.labelAr) return failure("checkFields");

  if (id) {
    await db
      .update(links)
      .set(values)
      .where(and(eq(links.id, id), eq(links.kind, values.kind)));
  } else {
    await db.insert(links).values({ ...values, sortOrder: await nextSortOrder(links, eq(links.kind, values.kind)) });
  }
  refresh();
  return success();
}

export async function deleteLink(formData: FormData) {
  await requireOwner();
  await getDb().delete(links).where(eq(links.id, Number(formData.get("id"))));
  refresh();
}
