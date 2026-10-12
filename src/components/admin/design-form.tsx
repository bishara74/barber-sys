"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import { saveDesign } from "@/actions/profile";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Checkbox } from "@/components/ui/field";
import { resolveTheme, THEME_NAMES, THEMES, themeVars, type ThemeChoice, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Preset picker and color overrides, with a live preview of the result. */
export function DesignForm({ design }: { design: ThemeChoice & { theme: ThemeName } }) {
  const t = useTranslations("admin.design");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const [theme, setTheme] = useState<ThemeName>(design.theme);
  const [primary, setPrimary] = useState(design.primary);
  const [accent, setAccent] = useState(design.accent);

  const preset = THEMES[theme];
  const resolved = resolveTheme({ theme, primary, accent });

  return (
    <ActionForm action={saveDesign}>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">{t("theme")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEME_NAMES.map((name) => {
            const option = THEMES[name];
            return (
              <label
                key={name}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-theme border p-2.5 text-sm",
                  name === theme ? "border-primary" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={name}
                  checked={name === theme}
                  onChange={() => setTheme(name)}
                  className="sr-only"
                />
                <span
                  className="flex size-10 shrink-0 items-end justify-end gap-0.5 rounded-md border p-1"
                  style={{ background: option.background, borderColor: option.border }}
                  aria-hidden
                >
                  <span className="size-3 rounded-full" style={{ background: option.accent }} />
                  <span className="size-3 rounded-full" style={{ background: option.primary }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t(`themes.${name}`)}</span>
                  <span className="block text-xs text-muted">{t(option.scheme)}</span>
                </span>
                {name === theme ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
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

      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("preview")}</p>
        {/* The real theme variables, scoped to this box, so the preview matches the live page. */}
        <div
          style={{ ...themeVars(resolved), colorScheme: resolved.scheme } as CSSProperties}
          className="space-y-3 rounded-theme border border-border bg-background p-4 text-foreground"
        >
          <div className="rounded-theme bg-accent px-3 py-6 text-center font-semibold">{t("previewShop")}</div>
          <div className="flex items-center justify-between rounded-theme border border-border bg-card px-3 py-2 text-sm">
            <span>
              <span className="block">{t("previewService")}</span>
              <span className="text-xs text-muted">{tc("minutes", { count: 30 })}</span>
            </span>
            <span className="font-medium">₪40</span>
          </div>
          <div className="flex h-11 items-center justify-center rounded-theme bg-primary font-medium text-primary-foreground">
            {th("book")}
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
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={custom ? value : presetColor}
          disabled={!custom}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="h-10 w-14 cursor-pointer rounded-theme border border-border bg-card p-1 disabled:cursor-default disabled:opacity-60"
        />
        <Checkbox
          label={t("custom")}
          checked={custom}
          onChange={(event) => onChange(event.target.checked ? presetColor : "")}
        />
      </div>
      <p className="text-xs text-muted">{hint}</p>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
