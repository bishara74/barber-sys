import { localized } from "@/i18n/locales";
import { getDesign, getProfile } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { resolveTheme, themeVars } from "@/lib/theme";

const SCISSORS =
  '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(16 16) scale(1.33)">' +
  '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></g>';

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * The browser tab icon for shops without their own icon or logo: the shop's first letter
 * on its main color. Linked with a version parameter, so a new name or color shows up right away.
 */
export async function GET() {
  const [profile, design] = await Promise.all([getProfile(), getDesign()]);
  const theme = resolveTheme(design);
  const background = theme.primary;
  const foreground = themeVars(theme)["--primary-foreground"];
  // One icon for the whole site, so it follows the shop's main language.
  const name = localized(getDeploymentConfig().defaultLocale, profile.nameEn, profile.nameAr);
  const letter = [...name.trim()][0];

  const mark = letter
    ? `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="36" font-weight="700" fill="${foreground}">${escapeXml(letter.toUpperCase())}</text>`
    : `<g color="${foreground}">${SCISSORS}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${background}"/>${mark}</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=300",
    },
  });
}
