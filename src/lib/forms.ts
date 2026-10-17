import "server-only";
import type { Messages } from "next-intl";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getDeploymentConfig } from "./env";
import { parseMoney } from "./money";
import { parseLocalDateTime } from "./time";

export type ErrorKey = keyof Messages["errors"];

/** State shared by every form that posts to a Server Action (see components/ui/action-form). */
export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fields?: Record<string, string> };

export const idle: ActionState = { status: "idle" };

export async function success(key: "saved" | "deleted" = "saved"): Promise<ActionState> {
  const t = await getTranslations("forms");
  return { status: "success", message: t(key) };
}

export async function failure(key: ErrorKey): Promise<ActionState> {
  const t = await getTranslations("errors");
  return { status: "error", message: t(key) };
}

// Field schemas for FormData values.
export const fields = {
  /** Optional text. A missing field is "", but text over the limit is an error rather than silently dropped. */
  text: (max = 500) => z.string().trim().max(max).default(""),
  requiredText: (max = 200) => z.string().trim().min(1).max(max),
  checkbox: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
  int: (min: number, max: number) => z.coerce.number().int().min(min).max(max),
  optionalId: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().int().positive().nullable(),
  ),
  /** Money typed in major units ("45.5"); stored as minor units. Empty means no price. Never negative. */
  money: z
    .string()
    .transform(parseMoney)
    .refine((value) => value === null || (Number.isFinite(value) && value >= 0)),
  /** Money that must be present. May be negative (a discount option). */
  requiredMoney: z
    .string()
    .transform((value) => parseMoney(value) ?? 0)
    .refine((value) => Number.isFinite(value)),
  /** A datetime-local value ("2026-10-14T09:30") in the shop's time zone, as an instant. */
  dateTime: z.string().transform((value, ctx) => {
    const ms = parseLocalDateTime(value, getDeploymentConfig().timeZone);
    if (ms === null) ctx.addIssue({ code: "custom", message: "Invalid date" });
    return ms ?? 0;
  }),
  ids: z.preprocess(
    (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]),
    z.array(z.coerce.number().int().positive()),
  ),
};

function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = formData.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

/** Validates FormData against a schema. On failure returns an error state that marks the bad fields. */
export async function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): Promise<{ ok: true; data: z.output<T> } | { ok: false; state: ActionState }> {
  const result = schema.safeParse(formDataToObject(formData));
  if (result.success) return { ok: true, data: result.data };

  const t = await getTranslations("errors");
  const invalid = t("invalidField");
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const name = String(issue.path[0] ?? "");
    if (name) fieldErrors[name] = invalid;
  }
  return { ok: false, state: { status: "error", message: t("checkFields"), fields: fieldErrors } };
}
