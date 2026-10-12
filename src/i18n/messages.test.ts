import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

function keys(messages: object, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

/** ICU arguments like {name} or {count, plural, ...}, ignoring the text inside plural branches. */
function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)[,}]/g)].map((match) => match[1]).sort();
}

describe("translations", () => {
  it("has the same keys in English and Arabic", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });

  it("uses the same placeholders in both languages", () => {
    const lookup = (messages: object, key: string) =>
      key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages) as string;
    for (const key of keys(en)) {
      expect([key, placeholders(lookup(ar, key))]).toEqual([key, placeholders(lookup(en, key))]);
    }
  });
});
