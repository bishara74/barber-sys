import { CalendarCheck, ChevronDown, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Price } from "@/components/public/price";
import { SocialIcon, socialHref } from "@/components/social-icon";
import { buttonClass } from "@/components/ui/button";
import { localized } from "@/i18n/locales";
import { getCatalog } from "@/lib/catalog";
import { getProfile, getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { getVisibleLinks } from "@/lib/links";
import { getVisibleProducts } from "@/lib/products";
import { requestTime } from "@/lib/request";
import { getWeeklyHours } from "@/lib/schedule";
import { formatClock, localDate, weekdayName, weekdayOf } from "@/lib/time";
import { mediaUrl } from "@/lib/utils";


export default async function HomePage() {
  const [locale, t, profile, settings, catalog, { socials, buttons }, products, weekly] = await Promise.all([
    getLocale(),
    getTranslations(),
    getProfile(),
    getSettings(),
    getCatalog(),
    getVisibleLinks(),
    getVisibleProducts(),
    getWeeklyHours(),
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
  const today = weekdayOf(localDate(requestTime(), getDeploymentConfig().timeZone));

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-12">
      <header>
        <div className="relative h-40 overflow-hidden bg-accent sm:h-52 sm:rounded-b-theme">
          {profile.coverKey ? (
            <Image src={mediaUrl(profile.coverKey)} alt="" fill priority className="object-cover" sizes="512px" />
          ) : (
            <div className="h-full bg-gradient-to-br from-primary/30 to-accent" />
          )}
        </div>
        <div className="-mt-14 flex flex-col items-center px-4 text-center">
          <div className="relative size-28 overflow-hidden rounded-full border-4 border-background bg-card">
            {profile.avatarKey ? (
              <Image src={mediaUrl(profile.avatarKey)} alt={name} fill className="object-cover" sizes="112px" />
            ) : (
              <span className="flex h-full items-center justify-center text-4xl font-semibold text-primary">
                {name.slice(0, 1)}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold">{name}</h1>
          {tagline ? <p className="mt-1 text-muted">{tagline}</p> : null}
          {address ? (
            <a
              href={profile.mapUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <MapPin className="size-4" aria-hidden />
              {address}
            </a>
          ) : null}

          {socials.length > 0 ? (
            <nav className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Social">
              {socials.map((link) => (
                <a
                  key={link.id}
                  href={socialHref(link.platform!, link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.platform!}
                  className="flex size-11 items-center justify-center rounded-full border border-border bg-card hover:bg-accent"
                >
                  <SocialIcon platform={link.platform!} />
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <div className="mt-6 space-y-3 px-4">
        {!name && !canBook ? <p className="text-center text-muted">{t("home.notSetUp")}</p> : null}

        {canBook ? (
          <Link href="/book" className={buttonClass("primary", "lg", "w-full text-lg shadow-sm")}>
            <CalendarCheck className="size-5" aria-hidden />
            {t("home.book")}
          </Link>
        ) : null}

        {buttons.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("outline", "lg", "w-full")}
          >
            {localized(locale, link.labelEn, link.labelAr)}
          </a>
        ))}

        {bio ? <p className="whitespace-pre-line pt-2 text-center text-sm leading-relaxed">{bio}</p> : null}
      </div>

      {types.length > 0 ? (
        <section className="mt-10 px-4">
          <h2 className="mb-3 text-lg font-semibold">{t("home.services")}</h2>
          <div className="space-y-3">
            {types.map((type) => (
              <details key={type.id} open={types.length === 1} className="group rounded-theme border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium">
                  {localized(locale, type.nameEn, type.nameAr)}
                  <ChevronDown className="size-4 text-muted transition group-open:rotate-180" aria-hidden />
                </summary>
                <ul className="divide-y divide-border border-t border-border">
                  {type.services.map((service) => {
                    const bookable = service.bookableOnline && service.staffIds.length > 0;
                    const row = (
                      <>
                        <span>
                          <span className="block">{localized(locale, service.nameEn, service.nameAr)}</span>
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="size-3" aria-hidden />
                            {t("common.minutes", { count: service.durationMin })}
                            {bookable ? null : ` · ${t("home.onlineBookingOff")}`}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-medium">
                          <Price amount={service.price} isFrom={service.priceIsFrom} currency={settings.currency} />
                        </span>
                      </>
                    );
                    const rowClass = "flex items-start justify-between gap-3 px-4 py-3";
                    return (
                      <li key={service.id}>
                        {bookable ? (
                          <Link href={`/book?service=${service.id}`} className={`${rowClass} hover:bg-accent`}>
                            {row}
                          </Link>
                        ) : (
                          <div className={rowClass}>{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section id="products" className="mt-10 scroll-mt-4 px-4">
          <h2 className="mb-3 text-lg font-semibold">{t("home.products")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Link key={product.id} href={`/p/${product.id}`} className="group overflow-hidden rounded-theme border border-border bg-card">
                <div className="relative aspect-square bg-accent">
                  {product.images[0] ? (
                    <Image
                      src={mediaUrl(product.images[0].key)}
                      alt=""
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 512px) 50vw, 256px"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium">{localized(locale, product.nameEn, product.nameAr)}</p>
                  <p className="mt-1 text-sm text-muted">
                    {product.inStock ? (
                      <Price amount={product.price} currency={settings.currency} />
                    ) : (
                      t("home.outOfStock")
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {isOpenAtAll ? (
        <section className="mt-10 px-4">
          <h2 className="mb-3 text-lg font-semibold">{t("home.hours")}</h2>
          <dl className="divide-y divide-border rounded-theme border border-border bg-card text-sm">
            {weekly.map((shifts, weekday) => (
              <div key={weekday} className={`flex justify-between px-4 py-2 ${weekday === today ? "font-semibold" : ""}`}>
                <dt>{weekdayName(weekday, locale)}</dt>
                <dd dir="ltr" className={shifts.length === 0 ? "text-muted" : ""}>
                  {shifts.length === 0
                    ? t("home.closed")
                    : shifts.map((s) => `${formatClock(s.startMin)}–${formatClock(s.endMin)}`).join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <footer className="mt-10 flex items-center justify-center gap-4 px-4 text-sm text-muted">
        <LocaleSwitcher />
      </footer>
    </main>
  );
}
