"use server";

import { eq, type SQL } from "drizzle-orm";
import { refresh } from "next/cache";
import { getDb } from "@/db";
import { links, optionGroups, options, productImages, products, services, serviceTypes, staff } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { moveRow } from "@/lib/sort";

/** Each sortable list, and how to find the siblings a row is ordered among. */
const lists = {
  serviceType: { table: serviceTypes, scope: async () => undefined },
  service: {
    table: services,
    scope: async (id: number) => {
      const row = await getDb().query.services.findFirst({ where: eq(services.id, id) });
      return row ? eq(services.typeId, row.typeId) : undefined;
    },
  },
  optionGroup: {
    table: optionGroups,
    scope: async (id: number) => {
      const row = await getDb().query.optionGroups.findFirst({ where: eq(optionGroups.id, id) });
      return row ? eq(optionGroups.serviceId, row.serviceId) : undefined;
    },
  },
  option: {
    table: options,
    scope: async (id: number) => {
      const row = await getDb().query.options.findFirst({ where: eq(options.id, id) });
      return row ? eq(options.groupId, row.groupId) : undefined;
    },
  },
  product: { table: products, scope: async () => undefined },
  productImage: {
    table: productImages,
    scope: async (id: number) => {
      const row = await getDb().query.productImages.findFirst({ where: eq(productImages.id, id) });
      return row ? eq(productImages.productId, row.productId) : undefined;
    },
  },
  link: {
    table: links,
    scope: async (id: number) => {
      const row = await getDb().query.links.findFirst({ where: eq(links.id, id) });
      return row ? eq(links.kind, row.kind) : undefined;
    },
  },
  staff: { table: staff, scope: async () => undefined },
} satisfies Record<string, { table: Parameters<typeof moveRow>[0]; scope: (id: number) => Promise<SQL | undefined> }>;

export type SortableList = keyof typeof lists;

export async function moveItem(formData: FormData) {
  await requireOwner();
  const list = lists[String(formData.get("list")) as SortableList];
  const id = Number(formData.get("id"));
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!list || !Number.isInteger(id)) return;

  await moveRow(list.table, id, direction, await list.scope(id));
  refresh();
}
