import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { ShopMark } from "@/components/shop-mark";
import { localized } from "@/i18n/locales";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/config";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [user, profile, locale] = await Promise.all([requireUser(), getProfile(), getLocale()]);
  const shopName = localized(locale, profile.nameEn, profile.nameAr) || "Dashboard";

  return (
    <div className="min-h-screen">
      <AdminNav
        shopName={shopName}
        shopMark={<ShopMark name={shopName} logoKey={profile.avatarKey} className="size-9 text-sm" sizes="40px" />}
        userName={user.name}
        isOwner={user.role === "owner"}
      />
      <main className="px-4 pt-5 pb-28 sm:px-6 lg:ms-64 lg:px-10 lg:pt-8 lg:pb-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
