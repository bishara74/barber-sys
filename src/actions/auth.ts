"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";
import { hashPassword, verifyPassword } from "@/lib/password";
import { verifyTurnstile } from "@/lib/turnstile";

// Checked against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = "pbkdf2_sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
  turnstileToken: fields.text(4000),
});

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = await parseForm(loginSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { email, password, turnstileToken } = parsed.data;

  if (!(await verifyTurnstile(turnstileToken))) return failure("botCheck");

  const user = await getDb().query.users.findFirst({ where: eq(users.email, email) });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return failure("invalidCredentials");

  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function changePassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = await parseForm(passwordSchema, formData);
  if (!parsed.ok) return parsed.state;

  const row = await getDb().query.users.findFirst({ where: eq(users.id, user.id) });
  if (!row || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
    return failure("wrongPassword");
  }
  await getDb()
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
    .where(eq(users.id, user.id));
  return success();
}
