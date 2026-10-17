import "server-only";
import { and, count, desc, eq, getTableColumns, like, max, or } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, customers } from "@/db/schema";

const PAGE_SIZE = 100;

/** Customers matching a name or phone search, with their completed visits. Newest first. */
export async function searchCustomers(query: string) {
  const text = query.trim();
  const digits = text.replace(/\D/g, "");
  return getDb()
    .select({
      ...getTableColumns(customers),
      visits: count(bookings.id),
      lastVisit: max(bookings.startsAt),
    })
    .from(customers)
    .leftJoin(bookings, and(eq(bookings.customerId, customers.id), eq(bookings.status, "completed")))
    .where(
      text
        ? or(like(customers.name, `%${text}%`), digits ? like(customers.phone, `%${digits}%`) : undefined)
        : undefined,
    )
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .limit(PAGE_SIZE);
}

export async function getCustomer(id: number) {
  return getDb().query.customers.findFirst({ where: eq(customers.id, id) });
}

export async function getCustomerBookings(customerId: number) {
  return getDb()
    .select()
    .from(bookings)
    .where(eq(bookings.customerId, customerId))
    .orderBy(desc(bookings.startsAt));
}
