import "server-only";
import { asc, eq, sql, type SQL } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { getDb } from "@/db";

type SortableTable = SQLiteTable & { id: SQLiteColumn; sortOrder: SQLiteColumn };

/**
 * Moves a row one place up or down among its siblings (rows matching `scope`),
 * then renumbers the siblings so sort orders stay 0, 1, 2, ...
 */
export async function moveRow(table: SortableTable, id: number, direction: "up" | "down", scope?: SQL) {
  const db = getDb();
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(scope)
    .orderBy(asc(table.sortOrder), asc(table.id));

  const ids = rows.map((row) => row.id as number);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];

  const [first, ...rest] = ids.map((rowId, index) =>
    db.run(sql`UPDATE ${table} SET ${sql.identifier(table.sortOrder.name)} = ${index} WHERE ${eq(table.id, rowId)}`),
  );
  await db.batch([first, ...rest]);
}

/** Sort order for a new row: after all its siblings. */
export async function nextSortOrder(table: SortableTable, scope?: SQL): Promise<number> {
  const [row] = await getDb()
    .select({ max: sql<number | null>`max(${table.sortOrder})` })
    .from(table)
    .where(scope);
  return (row?.max ?? -1) + 1;
}
