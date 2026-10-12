import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { localeDirection, localized } from "@/i18n/locales";
import { getProfile } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { requestOrigin } from "@/lib/request";
import { resolveTheme, themeCss } from "@/lib/theme";
import { mediaUrl } from "@/lib/utils";
import "./globals.css";

// One family that covers both Arabic and Latin text.
const font = IBM_Plex_Sans_Arabic({
  variable: "--font-app",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function currentTheme() {
  const { theme, themePrimary, themeAccent } = getDeploymentConfig();
  return resolveTheme(theme, themePrimary, themeAccent);
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, profile, origin] = await Promise.all([getLocale(), getProfile(), requestOrigin()]);
  const name = localized(locale, profile.nameEn, profile.nameAr) || "Booking";
  const description = localized(locale, profile.taglineEn, profile.taglineAr) || undefined;
  const image = profile.coverKey || profile.avatarKey;
  return {
    // Absolute URLs for link previews, per deployment and domain.
    metadataBase: new URL(origin),
    title: { default: name, template: `%s · ${name}` },
    description,
    icons: profile.avatarKey ? { icon: mediaUrl(profile.avatarKey) } : undefined,
    openGraph: { title: name, description, images: image ? [mediaUrl(image)] : undefined },
  };
}

export function generateViewport(): Viewport {
  return { themeColor: currentTheme().background };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const theme = currentTheme();

  return (
    <html
      lang={locale}
      dir={localeDirection(locale)}
      data-scheme={theme.scheme}
      className={`${font.variable} h-full antialiased`}
    >
      <head>
        <style>{themeCss(theme)}</style>
      </head>
      <body className="min-h-full font-sans">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
