import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { localeDirection, localized } from "@/i18n/locales";
import { brandIconUrl, getDesign, getProfile, type Design, type Profile } from "@/lib/config";
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

/** The shop's design, chosen in the dashboard and stored in the database. */
async function currentTheme() {
  return resolveTheme(await getDesign());
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, profile, design, origin] = await Promise.all([
    getLocale(),
    getProfile(),
    getDesign(),
    requestOrigin(),
  ]);
  const name = localized(locale, profile.nameEn, profile.nameAr) || "Booking";
  const description = localized(locale, profile.taglineEn, profile.taglineAr) || undefined;
  const image = profile.coverKey || profile.avatarKey;
  return {
    // Absolute URLs for link previews, per deployment and domain.
    metadataBase: new URL(origin),
    title: { default: name, template: `%s · ${name}` },
    description,
    icons: shopIcon(profile, design),
    openGraph: { title: name, description, images: image ? [mediaUrl(image)] : undefined },
  };
}

/** The browser tab and home screen icon: the shop's own icon, else its logo, else its initial. */
function shopIcon(profile: Profile, design: Design): Metadata["icons"] {
  const key = profile.faviconKey || profile.avatarKey;
  if (key) return { icon: mediaUrl(key), apple: mediaUrl(key) };
  return { icon: { url: brandIconUrl(profile, design), type: "image/svg+xml" } };
}

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await currentTheme()).background };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getLocale(), currentTheme()]);

  return (
    <html
      lang={locale}
      dir={localeDirection(locale)}
      data-scheme={theme.scheme}
      // Smooth scrolling for in-page links; Next.js turns it off while switching pages.
      data-scroll-behavior="smooth"
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
