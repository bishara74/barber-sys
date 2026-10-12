/**
 * Design presets. Each deployment picks one with the THEME var and can override
 * the main colors with THEME_PRIMARY / THEME_ACCENT (hex, e.g. "#c9a227").
 */
type Theme = {
  scheme: "light" | "dark";
  background: string;
  foreground: string;
  card: string;
  muted: string;
  border: string;
  primary: string;
  accent: string;
  radius: string;
};

export const THEMES = {
  classic: {
    scheme: "light",
    background: "#faf7f2",
    foreground: "#1c1917",
    card: "#ffffff",
    muted: "#78716c",
    border: "#e7e1d8",
    primary: "#9a3412",
    accent: "#f3ece2",
    radius: "14px",
  },
  noir: {
    scheme: "dark",
    background: "#0c0c0d",
    foreground: "#f5f5f4",
    card: "#17171a",
    muted: "#a1a1aa",
    border: "#2a2a2e",
    primary: "#d4af37",
    accent: "#202024",
    radius: "12px",
  },
  ocean: {
    scheme: "light",
    background: "#f3f8fb",
    foreground: "#0f172a",
    card: "#ffffff",
    muted: "#64748b",
    border: "#dbe7ef",
    primary: "#0e7490",
    accent: "#e3f0f6",
    radius: "16px",
  },
  rose: {
    scheme: "light",
    background: "#fdf6f7",
    foreground: "#2a1215",
    card: "#ffffff",
    muted: "#8b6b70",
    border: "#f1dde0",
    primary: "#be185d",
    accent: "#fbe9ee",
    radius: "20px",
  },
  forest: {
    scheme: "light",
    background: "#f6f8f4",
    foreground: "#14200f",
    card: "#ffffff",
    muted: "#66735f",
    border: "#dfe6d8",
    primary: "#3f6212",
    accent: "#edf2e6",
    radius: "10px",
  },
  ink: {
    scheme: "dark",
    background: "#0a0a0a",
    foreground: "#fafafa",
    card: "#151515",
    muted: "#a3a3a3",
    border: "#262626",
    primary: "#e11d48",
    accent: "#1c1c1c",
    radius: "6px",
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof THEMES;

const HEX = /^#[0-9a-f]{6}$/i;

/** Black or white text, whichever reads better on the given color. */
function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? "#111111" : "#ffffff";
}

export function resolveTheme(name: string, primary: string, accent: string): Theme {
  const base: Theme = name in THEMES ? THEMES[name as ThemeName] : THEMES.classic;
  return {
    ...base,
    primary: HEX.test(primary) ? primary : base.primary,
    accent: HEX.test(accent) ? accent : base.accent,
  };
}

/** CSS custom properties consumed by globals.css. */
export function themeCss(theme: Theme): string {
  const vars: Record<string, string> = {
    "--background": theme.background,
    "--foreground": theme.foreground,
    "--card": theme.card,
    "--muted": theme.muted,
    "--border": theme.border,
    "--primary": theme.primary,
    "--primary-foreground": readableOn(theme.primary),
    "--accent": theme.accent,
    "--radius": theme.radius,
    "color-scheme": theme.scheme,
  };
  return `:root{${Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";")}}`;
}
