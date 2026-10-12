import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isLocale, type Locale } from "@/i18n/locales";

/** Cloudflare bindings for the current request. */
export function getBindings(): CloudflareEnv {
  return getCloudflareContext().env;
}

export type DeploymentConfig = {
  theme: string;
  themePrimary: string;
  themeAccent: string;
  defaultLocale: Locale;
  timeZone: string;
  turnstileSiteKey: string;
  turnstileSecretKey: string;
};

/** Per-deployment settings that come from Wrangler vars and secrets, not the database. */
export function getDeploymentConfig(): DeploymentConfig {
  const env = getBindings();
  return {
    theme: env.THEME || "classic",
    themePrimary: env.THEME_PRIMARY ?? "",
    themeAccent: env.THEME_ACCENT ?? "",
    defaultLocale: isLocale(env.DEFAULT_LOCALE) ? env.DEFAULT_LOCALE : "ar",
    timeZone: env.TIMEZONE || "Asia/Jerusalem",
    turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? "",
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY ?? "",
  };
}
