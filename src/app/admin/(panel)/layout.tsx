import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { localized } from "@/i18n/locales";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/config";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [user, profile, locale] = await Promise.all([requireUser(), getProfile(), getLocale()]);

  return (
    <div className="min-h-screen">
      <AdminNav
        shopName={localized(locale, profile.nameEn, profile.nameAr) || "Dashboard"}
        userName={user.name}
        isOwner={user.role === "owner"}
      />
      <main className="px-4 py-6 lg:ms-60 lg:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
