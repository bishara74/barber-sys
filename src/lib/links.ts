import "server-only";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { links } from "@/db/schema";

/** Social icons and link buttons, in display order. */
export async function getLinks() {
  const rows = await getDb().select().from(links).orderBy(asc(links.sortOrder), asc(links.id));
  return {
    socials: rows.filter((link) => link.kind === "social"),
    buttons: rows.filter((link) => link.kind === "button"),
  };
}

export async function getVisibleLinks() {
  const { socials, buttons } = await getLinks();
  return {
    socials: socials.filter((link) => link.isVisible && link.platform),
    buttons: buttons.filter((link) => link.isVisible),
  };
}
