"use client";

import {
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  ContactRound,
  ExternalLink,
  House,
  LayoutGrid,
  Link2,
  LogOut,
  Plus,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, type Messages } from "next-intl";
import { useEffect, useState } from "react";
import { logout } from "@/actions/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Avatar } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NavKey = keyof Messages["admin"]["nav"];
type Item = { href: string; key: NavKey; icon: LucideIcon; ownerOnly: boolean };

const GROUPS: { key: NavKey; items: Item[] }[] = [
  {
    key: "groupDaily",
    items: [
      { href: "/admin", key: "dashboard", icon: House, ownerOnly: false },
      { href: "/admin/calendar", key: "calendar", icon: CalendarDays, ownerOnly: false },
      { href: "/admin/bookings/new", key: "newBooking", icon: CalendarPlus, ownerOnly: false },
      { href: "/admin/time-off", key: "timeOff", icon: CalendarOff, ownerOnly: false },
      { href: "/admin/customers", key: "customers", icon: ContactRound, ownerOnly: false },
    ],
  },
  {
    key: "groupShop",
    items: [
      { href: "/admin/services", key: "services", icon: Scissors, ownerOnly: true },
      { href: "/admin/products", key: "products", icon: ShoppingBag, ownerOnly: true },
      { href: "/admin/profile", key: "profile", icon: Link2, ownerOnly: true },
      { href: "/admin/staff", key: "staff", icon: Users, ownerOnly: true },
    ],
  },
  {
    key: "groupAdmin",
    items: [
      { href: "/admin/settings", key: "settings", icon: Settings, ownerOnly: true },
      { href: "/admin/users", key: "users", icon: ShieldCheck, ownerOnly: true },
      { href: "/admin/account", key: "account", icon: UserCog, ownerOnly: false },
    ],
  },
];

/** The phone tab bar; the middle slot is the "new booking" button. */
const TABS = ["/admin", "/admin/calendar", null, "/admin/customers"] as const;

type AdminNavProps = {
  shopName: string;
  /** The shop's logo or initial, rendered on the server. */
  shopMark: React.ReactNode;
  userName: string;
  isOwner: boolean;
};

export function AdminNav({ shopName, shopMark, userName, isOwner }: AdminNavProps) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isOwner || !item.ownerOnly),
  })).filter((group) => group.items.length > 0);
  const items = groups.flatMap((group) => group.items);
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  // Only the most specific match is active ("New booking" rather than its parent).
  const activeHref = items
    .filter((item) => isActive(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  // Close the sheet after navigating, and with Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const role = isOwner ? t("roleOwner") : t("roleStaff");

  return (
    <>
      {/* Desktop: fixed sidebar. */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-border bg-card lg:flex">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          {shopMark}
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{shopName}</p>
            <a
              href="/"
              target="_blank"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted transition hover:text-primary"
            >
              {t("viewSite")}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-2" aria-label={t("menu")}>
          {groups.map((group) => (
            <div key={group.key}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold text-muted/80">{t(group.key)}</p>
              <ul className="space-y-0.5">
                {group.items.map(({ href, key, icon: Icon }) => {
                  const active = href === activeHref;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-theme px-3 py-2 text-sm font-medium transition",
                          active
                            ? "bg-primary-soft text-primary before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-full before:bg-primary"
                            : "text-foreground/70 hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" aria-hidden />
                        {t(key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-theme px-2 py-1.5">
            <Avatar name={userName} className="size-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">{userName}</p>
              <p className="truncate text-xs text-muted">{role}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                aria-label={t("logout")}
                title={t("logout")}
                className="flex size-8 items-center justify-center rounded-theme text-muted transition hover:bg-red-500/10 hover:text-red-600"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
          <LocaleSwitcher variant="plain" className="px-2 py-1" />
        </div>
      </aside>

      {/* Phones and tablets: slim top bar. */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          {shopMark}
          <span className="min-w-0 flex-1 truncate font-semibold">{shopName}</span>
          <a
            href="/"
            target="_blank"
            aria-label={t("viewSite")}
            className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="size-[18px]" aria-hidden />
          </a>
        </div>
      </header>

      {/* Phones and tablets: bottom tab bar, easy to reach with a thumb. */}
      <nav
        aria-label={t("menu")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {TABS.map((href) => {
            if (href === null) {
              return (
                <li key="new" className="flex items-center justify-center">
                  <Link
                    href="/admin/bookings/new"
                    aria-label={t("newBooking")}
                    className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow ring-4 ring-background transition active:scale-95"
                  >
                    <Plus className="size-6" aria-hidden />
                  </Link>
                </li>
              );
            }
            const item = items.find((candidate) => candidate.href === href)!;
            const active = href === activeHref;
            return (
              <li key={href}>
                <TabLink href={href} label={t(item.key)} icon={item.icon} active={active} />
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                sheetOpen || (activeHref && !TABS.includes(activeHref as never)) ? "text-primary" : "text-muted",
              )}
            >
              <LayoutGrid className="size-5" aria-hidden />
              {t("more")}
            </button>
          </li>
        </ul>
      </nav>

      {sheetOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal aria-label={t("menu")}>
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-[calc(var(--radius)*1.75)] bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lift">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" aria-hidden />
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={userName} className="size-10 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-tight">{userName}</p>
                <p className="text-xs text-muted">{role}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t("close")}
                className="flex size-9 items-center justify-center rounded-full bg-accent text-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {groups.map((group) => (
              <div key={group.key} className="mb-4">
                <p className="mb-2 px-1 text-xs font-semibold text-muted">{t(group.key)}</p>
                <ul className="grid grid-cols-3 gap-2">
                  {group.items.map(({ href, key, icon: Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          "flex h-full flex-col items-center gap-2 rounded-theme border p-3 text-center text-xs font-medium transition active:scale-95",
                          href === activeHref
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border bg-surface/60 text-foreground/80",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                        {t(key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <LocaleSwitcher />
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-500/10"
                >
                  <LogOut className="size-4" aria-hidden />
                  {t("logout")}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function TabLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
        active ? "text-primary" : "text-muted hover:text-foreground",
      )}
    >
      {active ? <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden /> : null}
      <Icon className="size-5" aria-hidden />
      <span className="max-w-full truncate px-1">{label}</span>
    </Link>
  );
}
