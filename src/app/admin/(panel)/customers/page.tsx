import { ContactRound, Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/card";
import { controlClass } from "@/components/ui/control";
import { RowLink, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { searchCustomers } from "@/lib/customers";
import { getDeploymentConfig } from "@/lib/env";
import { displayPhone } from "@/lib/phone";
import { formatDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.customers");
  return { title: t("title") };
}

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireUser();
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q : "";
  const { timeZone } = getDeploymentConfig();
  const [locale, t, tc, customers] = await Promise.all([
    getLocale(),
    getTranslations("admin.customers"),
    getTranslations("common"),
    searchCustomers(search),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("resultCount", { count: customers.length })} />
      <form className="mb-4 flex gap-2" role="search">
        <div className="relative max-w-md min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            name="q"
            type="search"
            defaultValue={search}
            placeholder={t("searchPlaceholder")}
            aria-label={tc("search")}
            className={cn(controlClass, "h-11 ps-10 pe-10")}
          />
          {search ? (
            <Link
              href="/admin/customers"
              aria-label={tc("clear")}
              className="absolute end-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        <Button type="submit" variant="outline">
          {tc("search")}
        </Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState icon={ContactRound}>{search ? t("noResults") : t("noCustomers")}</EmptyState>
      ) : (
        <Table>
          <TableHead>
            <TableHeader>{t("name")}</TableHeader>
            <TableHeader className="hidden sm:table-cell">{t("phone")}</TableHeader>
            <TableHeader className="text-center">{t("visits")}</TableHeader>
            <TableHeader className="hidden md:table-cell">{t("lastVisit")}</TableHeader>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} href={`/admin/customers/${customer.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={customer.name} className="size-9 text-xs" />
                    <div className="min-w-0">
                      <RowLink href={`/admin/customers/${customer.id}`} className="block truncate">
                        {customer.name}
                      </RowLink>
                      <span className="block text-xs text-muted tabular-nums sm:hidden" dir="ltr">
                        {displayPhone(customer.phone)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted tabular-nums sm:table-cell">
                  <span dir="ltr">{displayPhone(customer.phone)}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                      customer.visits > 0 ? "bg-primary-soft text-primary" : "bg-accent text-muted",
                    )}
                  >
                    {customer.visits}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted md:table-cell">
                  {customer.lastVisit ? formatDate(customer.lastVisit.getTime(), locale, timeZone, "short") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
