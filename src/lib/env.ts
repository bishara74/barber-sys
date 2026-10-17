import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isLocale, type Locale } from "@/i18n/locales";

/** Cloudflare bindings for the current request. */
export function getBindings(): CloudflareEnv {
  return getCloudflareContext().env;
}

export type DeploymentConfig = {
  defaultLocale: Locale;
  timeZone: string;
  turnstileSiteKey: string;
  turnstileSecretKey: string;
};

/**
 * Per-deployment settings that come from Wrangler vars and secrets, not the database.
 * The design is shop data and lives in the database (lib/config).
 */
export function getDeploymentConfig(): DeploymentConfig {
  const env = getBindings();
  return {
    defaultLocale: isLocale(env.DEFAULT_LOCALE) ? env.DEFAULT_LOCALE : "ar",
    timeZone: env.TIMEZONE || "Asia/Jerusalem",
    turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? "",
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY ?? "",
  };
}
