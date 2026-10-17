import "server-only";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

/** Dashboard accounts, without password hashes. */
export async function getUsers() {
  return getDb()
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, staffId: users.staffId })
    .from(users)
    .orderBy(asc(users.createdAt));
}
