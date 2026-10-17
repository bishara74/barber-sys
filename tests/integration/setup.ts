import { vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", async () => {
  const database = await import("./d1");
  return {
    getBindings: () => ({ DB: database.binding }),
    getDeploymentConfig: () => ({
      timeZone: database.TIME_ZONE,
      defaultLocale: "en",
      turnstileSiteKey: "",
      turnstileSecretKey: "",
    }),
  };
});
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: vi.fn() }), headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(`redirect:${url}`); },
}));
