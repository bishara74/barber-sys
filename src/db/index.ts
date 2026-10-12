import "server-only";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";
import { getBindings } from "@/lib/env";
import * as schema from "./schema";

/** Drizzle client bound to this request's D1 database. */
export const getDb = cache(() => drizzle(getBindings().DB, { schema }));
