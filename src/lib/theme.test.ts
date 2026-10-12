import { describe, expect, it } from "vitest";
import { resolveTheme, themeCss, THEMES } from "./theme";

describe("resolveTheme", () => {
  it("uses the preset's colors when there are no overrides", () => {
    expect(resolveTheme({ theme: "noir", primary: "", accent: "" })).toEqual(THEMES.noir);
  });

  it("applies valid color overrides", () => {
    const theme = resolveTheme({ theme: "ocean", primary: "#2f9e6e", accent: "#EEEEEE" });
    expect(theme.primary).toBe("#2f9e6e");
    expect(theme.accent).toBe("#EEEEEE");
    expect(theme.background).toBe(THEMES.ocean.background);
  });

  it("falls back to classic for an unknown preset", () => {
    expect(resolveTheme({ theme: "nope", primary: "", accent: "" })).toEqual(THEMES.classic);
  });

  // Stored values end up inside a <style> tag, so only plain hex colors may get through.
  it("ignores anything that is not a hex color", () => {
    const theme = resolveTheme({ theme: "classic", primary: "red;}body{display:none", accent: "#fff" });
    expect(theme.primary).toBe(THEMES.classic.primary);
    expect(theme.accent).toBe(THEMES.classic.accent);
    expect(themeCss(theme)).not.toContain("display");
  });
});

describe("themeCss", () => {
  it("picks readable text on the main color", () => {
    expect(themeCss(resolveTheme({ theme: "noir", primary: "", accent: "" }))).toContain("--primary-foreground:#111111");
    expect(themeCss(resolveTheme({ theme: "classic", primary: "", accent: "" }))).toContain("--primary-foreground:#ffffff");
  });
});
