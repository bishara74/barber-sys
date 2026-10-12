import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { randomToken, sha256 } from "./crypto";
import { DAY } from "./time";

const SESSION_COOKIE = "session";
const SESSION_TTL = 30 * DAY;

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "staffId">;

export async function createSession(userId: number) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  await getDb()
    .insert(sessions)
    .values({ id: await sha256(token), userId, expiresAt });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await getDb().delete(sessions).where(eq(sessions.id, await sha256(token)));
  store.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await getDb()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      staffId: users.staffId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, await sha256(token)))
    .limit(1);

  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, staffId: row.staffId };
});

/** For pages and actions behind the login. Redirects to the login page when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For owner-only pages and actions (catalog, settings, staff, users). */
export async function requireOwner(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/admin");
  return user;
}

/** Staff accounts only see bookings for their own staff profile. */
export function canManageStaffBookings(user: SessionUser, staffId: number): boolean {
  return user.role === "owner" || user.staffId === staffId;
}
