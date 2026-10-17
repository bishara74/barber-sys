import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

export const TIME_ZONE = "Asia/Jerusalem";
let runtime: Miniflare;
export let binding: Awaited<ReturnType<Miniflare["getD1Database"]>>;

export async function startDatabase() {
  // Miniflare v5 accepts the older binding shorthand through this explicit adapter.
  // No persistence or Wrangler config: this database cannot reach demo/remote data.
  runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: "export default { fetch() { return new Response('integration'); } };",
    compatibilityDate: "2026-10-01",
    d1Databases: ["DB"],
  }));
  binding = await runtime.getD1Database("DB");
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string }[];
  };
  for (const { tag } of journal.entries) {
    const migration = await readFile(`drizzle/${tag}.sql`, "utf8");
    const statements = migration.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    await binding.batch(statements.map((statement) => binding.prepare(statement)));
  }
}

export async function resetDatabase() {
  const statements = [
    ...["bookings", "customers", "time_off", "working_hours", "staff_services", "options", "option_groups", "services", "service_types", "staff", "config"]
      .map((table) => `DELETE FROM ${table}`),
    "INSERT INTO service_types (id, name_en) VALUES (1, 'Barbershop')",
    "INSERT INTO services (id, type_id, name_en, name_ar, price, duration_min, buffer_min) VALUES (1, 1, 'Haircut', 'قص شعر', 5000, 30, 15)",
    "INSERT INTO staff (id, name) VALUES (1, 'Ali'), (2, 'Sami')",
    "INSERT INTO staff_services (staff_id, service_id) VALUES (1, 1), (2, 1)",
    "INSERT INTO option_groups (id, service_id, name_en, selection, is_required) VALUES (1, 1, 'Length', 'single', 1), (2, 1, 'Extras', 'multiple', 0)",
    "INSERT INTO options (id, group_id, name_en, price_delta, duration_delta) VALUES (1, 1, 'Short', 0, 0), (2, 1, 'Long', 1000, 15), (3, 2, 'Beard', 1500, 15)",
  ];
  for (const staffId of [1, 2]) {
    for (const weekday of [0, 1, 2, 3, 4, 6]) {
      statements.push(`INSERT INTO working_hours (staff_id, weekday, start_min, end_min) VALUES (${staffId}, ${weekday}, 540, 780), (${staffId}, ${weekday}, 840, 1200)`);
    }
  }
  await binding.batch(statements.map((statement) => binding.prepare(statement)));
}

export async function stopDatabase() {
  await runtime?.dispose();
}
