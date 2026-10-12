"use client";

import {
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  ContactRound,
  ExternalLink,
  House,
  Link2,
  LogOut,
  Menu,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { logout } from "@/actions/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", key: "dashboard", icon: House, ownerOnly: false },
  { href: "/admin/calendar", key: "calendar", icon: CalendarDays, ownerOnly: false },
  { href: "/admin/bookings/new", key: "newBooking", icon: CalendarPlus, ownerOnly: false },
  { href: "/admin/time-off", key: "timeOff", icon: CalendarOff, ownerOnly: false },
  { href: "/admin/customers", key: "customers", icon: ContactRound, ownerOnly: false },
  { href: "/admin/services", key: "services", icon: Scissors, ownerOnly: true },
  { href: "/admin/products", key: "products", icon: ShoppingBag, ownerOnly: true },
  { href: "/admin/profile", key: "profile", icon: Link2, ownerOnly: true },
  { href: "/admin/staff", key: "staff", icon: Users, ownerOnly: true },
  { href: "/admin/settings", key: "settings", icon: Settings, ownerOnly: true },
  { href: "/admin/users", key: "users", icon: ShieldCheck, ownerOnly: true },
  { href: "/admin/account", key: "account", icon: UserCog, ownerOnly: false },
] as const;

type AdminNavProps = { shopName: string; userName: string; isOwner: boolean };

export function AdminNav({ shopName, userName, isOwner }: AdminNavProps) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const links = (
    <nav className="flex flex-col gap-1">
      {ITEMS.filter((item) => isOwner || !item.ownerOnly).map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-theme px-3 py-2 text-sm",
            isActive(href) ? "bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {t(key)}
        </Link>
      ))}
      <hr className="my-2 border-border" />
      <a href="/" target="_blank" className="flex items-center gap-3 rounded-theme px-3 py-2 text-sm hover:bg-accent">
        <ExternalLink className="size-4" aria-hidden />
        {t("viewSite")}
      </a>
      <form action={logout}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-theme px-3 py-2 text-sm hover:bg-accent">
          <LogOut className="size-4" aria-hidden />
          {t("logout")}
        </button>
      </form>
      <LocaleSwitcher className="px-3 py-2" />
    </nav>
  );

  return (
    <>
      {/* Phones and tablets: top bar with a dropdown menu. */}
      <div className="sticky top-0 z-20 border-b border-border bg-card lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="truncate font-semibold">{shopName}</span>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={t("menu")}
            className="rounded-theme p-2 hover:bg-accent"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open ? <div className="max-h-[80vh] overflow-y-auto border-t border-border p-3">{links}</div> : null}
      </div>

      {/* Desktop: fixed sidebar. */}
      <aside className="fixed inset-y-0 start-0 hidden w-60 flex-col overflow-y-auto border-e border-border bg-card p-4 lg:flex">
        <p className="truncate px-3 font-semibold">{shopName}</p>
        <p className="mb-4 truncate px-3 text-xs text-muted">{userName}</p>
        {links}
      </aside>
    </>
  );
}
