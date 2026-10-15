import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Scissors,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Price } from "@/components/public/price";
import { ShopMark } from "@/components/shop-mark";
import { PLATFORM_LABELS, SocialIcon, socialHref } from "@/components/social-icon";
import { buttonClass } from "@/components/ui/button";
import { localized } from "@/i18n/locales";
import { getTimeOffInRange } from "@/lib/agenda";
import { getCatalog } from "@/lib/catalog";
import { getProfile, getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { getVisibleLinks } from "@/lib/links";
import { openingStatus } from "@/lib/opening";
import { whatsappLink } from "@/lib/phone";
import { getVisibleProducts } from "@/lib/products";
import { requestTime } from "@/lib/request";
import { getWeeklyHours } from "@/lib/schedule";
import { formatClock, localDate, localMinutes, weekdayName, weekdayOf } from "@/lib/time";
import { cn, mediaUrl, stagger } from "@/lib/utils";

export default async function HomePage() {
  const now = requestTime();
  const { timeZone } = getDeploymentConfig();
  const [locale, t, profile, settings, catalog, { socials, buttons }, products, weekly, closures] = await Promise.all([
    getLocale(),
    getTranslations(),
    getProfile(),
    getSettings(),
    getCatalog(),
    getVisibleLinks(),
    getVisibleProducts(),
    getWeeklyHours(),
    getTimeOffInRange({ from: now, to: now + 1, staffId: null }),
  ]);

  const name = localized(locale, profile.nameEn, profile.nameAr);
  const tagline = localized(locale, profile.taglineEn, profile.taglineAr);
  const bio = localized(locale, profile.bioEn, profile.bioAr);
  const address = localized(locale, profile.addressEn, profile.addressAr);
  const types = catalog
    .filter((type) => type.isVisible)
    .map((type) => ({ ...type, services: type.services.filter((service) => service.isVisible) }))
    .filter((type) => type.services.length > 0);
  const canBook = types.some((type) =>
    type.services.some((service) => service.bookableOnline && service.staffIds.length > 0),
  );
  const isOpenAtAll = weekly.some((shifts) => shifts.length > 0);
  const today = weekdayOf(localDate(now, timeZone));
  const closedToday = closures.some((block) => block.staffId === null);
  const status = openingStatus(weekly, today, localMinutes(now, timeZone));

  let statusText = "";
  if (closedToday) statusText = t("home.closedNow");
  else if (status.open) statusText = t("home.openNow", { time: formatClock(status.until) });
  else if (status.next) {
    const time = formatClock(status.next.at);
    statusText =
      status.next.inDays === 0
        ? t("home.opensToday", { time })
        : status.next.inDays === 1
          ? t("home.opensTomorrow", { time })
          : t("home.opensOn", { day: weekdayName(status.next.weekday, locale), time });
  }
  const openNow = status.open && !closedToday;

  const contacts = [
    profile.mapUrl ? { href: profile.mapUrl, label: t("home.directions"), icon: Navigation } : null,
    profile.phone ? { href: `tel:+${profile.phone}`, label: t("home.call"), icon: Phone } : null,
    profile.whatsapp ? { href: whatsappLink(profile.whatsapp, ""), label: "WhatsApp", icon: MessageCircle } : null,
  ].filter((item) => item !== null);

  return (
    <div className="page-glow min-h-screen">
      {/* Compact bar that slides in once the visitor scrolls past the header. */}
      <div className="scroll-header fixed inset-x-0 top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
          <ShopMark name={name} logoKey={profile.avatarKey} className="size-8 text-sm" sizes="32px" />
          <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
          {canBook ? (
            <Link href="/book" className={buttonClass("primary", "sm")}>
              {t("home.bookShort")}
            </Link>
          ) : null}
        </div>
      </div>

      <main className="mx-auto max-w-xl pb-10">
        <header>
          <div className="relative h-52 overflow-hidden sm:h-64 sm:rounded-b-[calc(var(--radius)*1.75)]">
            {profile.coverKey ? (
              <Image
                src={mediaUrl(profile.coverKey)}
                alt=""
                fill
                priority
                className="parallax object-cover"
                sizes="(max-width: 576px) 100vw, 576px"
              />
            ) : (
              <div className="hero-fallback parallax absolute inset-0" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-background via-transparent via-55% to-black/20" />
            <div className="absolute end-3 top-3">
              <LocaleSwitcher variant="glass" />
            </div>
          </div>

          <div className="relative -mt-16 flex flex-col items-center px-5 text-center">
            <ShopMark
              name={name}
              logoKey={profile.avatarKey}
              priority
              sizes="128px"
              className="size-32 animate-scale-in text-5xl shadow-lift ring-4 ring-background"
            />
            <h1 className="tracking-display mt-4 animate-fade-up text-3xl font-bold" style={stagger(1)}>
              {name}
            </h1>
            {tagline ? (
              <p className="mt-1.5 max-w-sm animate-fade-up text-muted" style={stagger(2)}>
                {tagline}
              </p>
            ) : null}

            {statusText || address ? (
              <div className="mt-4 flex animate-fade-up flex-wrap items-center justify-center gap-2" style={stagger(3)}>
                {statusText ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                      openNow
                        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                        : "bg-card text-muted ring-1 ring-border",
                    )}
                  >
                    <span className="relative flex size-2">
                      {openNow ? (
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      ) : null}
                      <span className={cn("relative size-2 rounded-full", openNow ? "bg-emerald-500" : "bg-muted/60")} />
                    </span>
                    <span dir="auto">{statusText}</span>
                  </span>
                ) : null}
                {address ? (
                  <a
                    href={profile.mapUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted ring-1 ring-border transition hover:text-foreground hover:ring-primary/40"
                  >
                    <MapPin className="size-3.5" aria-hidden />
                    {address}
                  </a>
                ) : null}
              </div>
            ) : null}

            {socials.length > 0 ? (
              <nav className="mt-5 flex flex-wrap justify-center gap-2.5" aria-label={t("home.social")}>
                {socials.map((link, index) => (
                  <a
                    key={link.id}
                    href={socialHref(link.platform!, link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={PLATFORM_LABELS[link.platform!]}
                    title={PLATFORM_LABELS[link.platform!]}
                    style={stagger(4 + index)}
                    className="flex size-11 animate-scale-in items-center justify-center rounded-full border border-border bg-card text-foreground/80 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-soft"
                  >
                    <SocialIcon platform={link.platform!} />
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
        </header>

        <div className="mt-7 space-y-3 px-4">
          {!name && !canBook ? <p className="text-center text-muted">{t("home.notSetUp")}</p> : null}

          {canBook ? (
            <Link
              href="/book"
              style={stagger(5)}
              className={buttonClass("primary", "lg", "group btn-shine h-14 w-full animate-fade-up text-[17px]")}
            >
              <CalendarCheck className="size-5" aria-hidden />
              {t("home.book")}
              <ArrowRight
                className="size-5 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                aria-hidden
              />
            </Link>
          ) : null}

          {buttons.map((link, index) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={stagger(6 + index)}
              className="group grid min-h-14 animate-fade-up grid-cols-[1.5rem_1fr_1.5rem] items-center gap-3 rounded-theme border border-border bg-card px-4 py-3 text-center font-medium shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <span />
              <span className="min-w-0">{localized(locale, link.labelEn, link.labelAr)}</span>
              <ArrowUpRight
                className="size-5 text-muted transition group-hover:text-primary rtl:-scale-x-100"
                aria-hidden
              />
            </a>
          ))}

          {bio ? (
            <p className="whitespace-pre-line px-2 pt-3 text-center text-[15px] leading-relaxed text-muted">{bio}</p>
          ) : null}
        </div>

        {types.length > 0 ? (
          <HomeSection title={t("home.services")} icon={Scissors}>
            <div className="space-y-4">
              {types.map((type) => (
                <div key={type.id} className="reveal overflow-hidden rounded-theme border border-border bg-card shadow-soft">
                  {types.length > 1 ? (
                    <h3 className="border-b border-border bg-surface px-4 py-3 text-sm font-semibold">
                      {localized(locale, type.nameEn, type.nameAr)}
                    </h3>
                  ) : null}
                  <ul className="divide-y divide-border">
                    {type.services.map((service) => {
                      const bookable = service.bookableOnline && service.staffIds.length > 0;
                      const description = localized(locale, service.descriptionEn, service.descriptionAr);
                      const row = (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium">{localized(locale, service.nameEn, service.nameAr)}</span>
                              <span className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-border" aria-hidden />
                              <span className="shrink-0 font-semibold text-primary">
                                <Price amount={service.price} isFrom={service.priceIsFrom} currency={settings.currency} />
                              </span>
                            </div>
                            {description ? <p className="mt-0.5 line-clamp-2 text-sm text-muted">{description}</p> : null}
                            <p className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="size-3.5" aria-hidden />
                                {t("common.minutes", { count: service.durationMin })}
                              </span>
                              {bookable ? null : (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="size-3.5" aria-hidden />
                                  {t("home.onlineBookingOff")}
                                </span>
                              )}
                            </p>
                          </div>
                          {bookable ? (
                            <ChevronRight
                              className="mt-0.5 size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                              aria-hidden
                            />
                          ) : null}
                        </>
                      );
                      const rowClass = "flex items-start gap-3 px-4 py-3.5";
                      return (
                        <li key={service.id}>
                          {bookable ? (
                            <Link
                              href={`/book?service=${service.id}`}
                              className={cn(rowClass, "group transition-colors hover:bg-primary-tint")}
                            >
                              {row}
                            </Link>
                          ) : (
                            <div className={rowClass}>{row}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </HomeSection>
        ) : null}

        {products.length > 0 ? (
          <HomeSection id="products" title={t("home.products")} icon={ShoppingBag}>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/p/${product.id}`}
                  className="reveal group overflow-hidden rounded-theme border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-accent">
                    {product.images[0] ? (
                      <Image
                        src={mediaUrl(product.images[0].key)}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 576px) 50vw, 288px"
                      />
                    ) : (
                      <ShoppingBag className="size-8 text-muted/50" aria-hidden />
                    )}
                    {!product.inStock ? (
                      <span className="absolute start-2 top-2 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted backdrop-blur">
                        {t("home.outOfStock")}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {localized(locale, product.nameEn, product.nameAr)}
                    </p>
                    {product.inStock ? (
                      <p className="text-sm font-semibold text-primary">
                        <Price amount={product.price} currency={settings.currency} />
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </HomeSection>
        ) : null}

        {isOpenAtAll || contacts.length > 0 ? (
          <HomeSection title={t("home.visit")} icon={Clock}>
            <div className="reveal overflow-hidden rounded-theme border border-border bg-card shadow-soft">
              {isOpenAtAll ? (
                <dl className="divide-y divide-border text-sm">
                  {weekly.map((shifts, weekday) => (
                    <div
                      key={weekday}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-2.5",
                        weekday === today && "bg-primary-tint font-semibold",
                      )}
                    >
                      <dt className="flex items-center gap-2">
                        {weekdayName(weekday, locale)}
                        {weekday === today ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {t("home.today")}
                          </span>
                        ) : null}
                      </dt>
                      <dd dir="ltr" className={cn("tabular-nums", shifts.length === 0 && "text-muted")}>
                        {shifts.length === 0
                          ? t("home.closed")
                          : shifts.map((s) => `${formatClock(s.startMin)}–${formatClock(s.endMin)}`).join(", ")}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {contacts.length > 0 ? (
                <div className={cn("space-y-3 p-4", isOpenAtAll && "border-t border-border bg-surface")}>
                  {address ? (
                    <p className="flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {address}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-3 gap-2">
                    {contacts.map((contact) => (
                      <ContactButton key={contact.label} {...contact} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </HomeSection>
        ) : null}

        <footer className="mt-12 flex flex-col items-center gap-3 px-4 text-xs text-muted">
          <LocaleSwitcher />
          <p>
            © {new Date(now).getFullYear()} {name}
          </p>
        </footer>
      </main>
    </div>
  );
}

function HomeSection({ title, icon: Icon, id, children }: { title: string; icon: LucideIcon; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-20 px-4">
      <h2 className="reveal mb-4 flex items-center gap-2.5 text-lg font-bold">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactButton({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1.5 rounded-theme border border-border bg-card px-2 py-3 text-xs font-medium shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
    >
      <Icon className="size-5 text-primary" aria-hidden />
      {label}
    </a>
  );
}
