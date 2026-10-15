"use client";

import { CalendarCheck, Check, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import { saveDesign } from "@/actions/profile";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Switch } from "@/components/ui/field";
import { resolveTheme, THEME_NAMES, THEMES, themeVars, type ThemeChoice, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/utils";

type DesignFormProps = { design: ThemeChoice & { theme: ThemeName }; shopName: string };

/** Preset picker and color overrides, with a live preview of the result. */
export function DesignForm({ design, shopName }: DesignFormProps) {
  const t = useTranslations("admin.design");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const [theme, setTheme] = useState<ThemeName>(design.theme);
  const [primary, setPrimary] = useState(design.primary);
  const [accent, setAccent] = useState(design.accent);

  const preset = THEMES[theme];
  const resolved = resolveTheme({ theme, primary, accent });
  const name = shopName || t("previewShop");

  return (
    <ActionForm action={saveDesign}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-sm font-medium">{t("theme")}</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {THEME_NAMES.map((option) => {
                const colors = THEMES[option];
                const selected = option === theme;
                return (
                  <label
                    key={option}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-theme border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-lift has-focus-visible:ring-4 has-focus-visible:ring-ring",
                      selected ? "border-primary ring-4 ring-ring" : "border-border",
                    )}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={option}
                      checked={selected}
                      onChange={() => setTheme(option)}
                      className="sr-only"
                    />
                    {/* A tiny page in the preset's own colors. */}
                    <span className="block space-y-1.5 p-2.5" style={{ background: colors.background }} aria-hidden>
                      <span className="block h-5 rounded-[4px]" style={{ background: colors.accent }} />
                      <span
                        className="flex h-4 items-center rounded-[4px] border px-1.5"
                        style={{ background: colors.card, borderColor: colors.border }}
                      >
                        <span className="h-1 w-8 rounded-full" style={{ background: colors.muted }} />
                      </span>
                      <span className="block h-4 rounded-[4px]" style={{ background: colors.primary }} />
                    </span>
                    <span className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{t(`themes.${option}`)}</span>
                        <span className="block text-[11px] text-muted">{t(colors.scheme)}</span>
                      </span>
                      {selected ? (
                        <span className="flex size-5 shrink-0 animate-scale-in items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" strokeWidth={3} aria-hidden />
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorOverride
              name="primary"
              label={t("primary")}
              hint={t("primaryHint")}
              value={primary}
              presetColor={preset.primary}
              onChange={setPrimary}
            />
            <ColorOverride
              name="accent"
              label={t("accent")}
              hint={t("accentHint")}
              value={accent}
              presetColor={preset.accent}
              onChange={setAccent}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("preview")}</p>
          {/* The real theme variables, scoped to this box, so the preview matches the live page. */}
          <div
            data-scheme={resolved.scheme}
            style={{ ...themeVars(resolved), colorScheme: resolved.scheme } as CSSProperties}
            className="theme-scope mx-auto w-full max-w-64 overflow-hidden rounded-[1.75rem] border-[6px] border-foreground/85 bg-background text-foreground shadow-lift"
          >
            <div className="hero-fallback h-20" />
            <div className="-mt-7 flex flex-col items-center px-3 pb-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground ring-4 ring-background">
                {[...name][0]}
              </span>
              <p className="mt-2 truncate text-sm font-bold">{name}</p>
              <span
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-theme bg-primary text-xs font-semibold text-primary-foreground shadow-glow"
              >
                <CalendarCheck className="size-3.5" aria-hidden />
                {th("book")}
              </span>
              <span className="mt-2 flex w-full items-center justify-between rounded-theme border border-border bg-card px-2.5 py-2 text-start text-xs">
                <span>
                  <span className="block font-medium">{t("previewService")}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                    <Clock className="size-2.5" aria-hidden />
                    {tc("minutes", { count: 30 })}
                  </span>
                </span>
                <span className="font-semibold text-primary">₪40</span>
              </span>
              <span className="mt-2 block h-6 w-full rounded-theme bg-accent" />
            </div>
          </div>
        </div>
      </div>

      <SubmitButton>{tc("save")}</SubmitButton>
    </ActionForm>
  );
}

type ColorOverrideProps = {
  name: string;
  label: string;
  hint: string;
  /** "" means the preset's own color. */
  value: string;
  presetColor: string;
  onChange: (value: string) => void;
};

function ColorOverride({ name, label, hint, value, presetColor, onChange }: ColorOverrideProps) {
  const t = useTranslations("admin.design");
  const custom = value !== "";
  return (
    <div className="space-y-3 rounded-theme border border-border bg-surface/40 p-3.5">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={custom ? value : presetColor}
          disabled={!custom}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="size-11 shrink-0 cursor-pointer rounded-full border border-border bg-card p-1 shadow-xs disabled:cursor-default [&::-moz-color-swatch]:rounded-full [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="font-mono text-xs text-muted uppercase" dir="ltr">
            {custom ? value : presetColor}
          </p>
        </div>
      </div>
      <Switch
        label={t("custom")}
        checked={custom}
        onChange={(event) => onChange(event.target.checked ? presetColor : "")}
        inline
      />
      <p className="text-xs leading-relaxed text-muted">{hint}</p>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
