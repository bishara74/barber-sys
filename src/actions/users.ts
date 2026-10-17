"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { USER_ROLES, users } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";
import { hashPassword } from "@/lib/password";

const email = z.string().trim().toLowerCase().pipe(z.email());
const password = z.string().min(8).max(200);

const createSchema = z.object({
  email,
  name: fields.requiredText(80),
  password,
  role: z.enum(USER_ROLES),
  staffId: fields.optionalId,
});

export async function createUser(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(createSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { password: plain, ...values } = parsed.data;

  const db = getDb();
  if (await db.query.users.findFirst({ where: eq(users.email, values.email) })) return failure("emailTaken");

  await db.insert(users).values({ ...values, passwordHash: await hashPassword(plain) });
  refresh();
  return success();
}

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  role: z.enum(USER_ROLES).optional(),
  staffId: fields.optionalId,
  password: z.union([z.literal(""), password]),
});

export async function updateUser(_state: ActionState, formData: FormData): Promise<ActionState> {
  const owner = await requireOwner();
  const parsed = await parseForm(updateSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, role, staffId, password: plain } = parsed.data;

  // Owners can't change their own role, so a shop always keeps an owner.
  const changes = {
    staffId,
    ...(role && id !== owner.id ? { role } : {}),
    ...(plain ? { passwordHash: await hashPassword(plain) } : {}),
  };
  await getDb().update(users).set(changes).where(eq(users.id, id));
  refresh();
  return success();
}

export async function deleteUser(_state: ActionState, formData: FormData): Promise<ActionState> {
  const owner = await requireOwner();
  const id = Number(formData.get("id"));
  if (id === owner.id) return failure("cannotDeleteSelf");

  await getDb().delete(users).where(eq(users.id, id));
  refresh();
  return success("deleted");
}
