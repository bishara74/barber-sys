import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { requireUser } from "@/lib/auth";
import { searchCustomers } from "@/lib/customers";
import { getDeploymentConfig } from "@/lib/env";
import { displayPhone } from "@/lib/phone";
import { formatDate } from "@/lib/time";

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
      <PageHeader title={t("title")} />
      <form className="mb-4 flex gap-2" role="search">
        <Input name="q" defaultValue={search} placeholder={t("searchPlaceholder")} aria-label={tc("search")} className="max-w-sm" />
        <Button type="submit" variant="outline">
          <Search className="size-4" aria-hidden />
          {tc("search")}
        </Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState>{t("noCustomers")}</EmptyState>
      ) : (
        <Card className="p-2 sm:p-2">
          <ul className="divide-y divide-border">
            {customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="flex items-center justify-between gap-3 rounded-theme p-2 hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{customer.name}</span>
                    <span className="block text-sm text-muted" dir="ltr">
                      {displayPhone(customer.phone)}
                    </span>
                  </span>
                  <span className="shrink-0 text-end text-sm text-muted">
                    <span className="block">
                      {t("visits")}: {customer.visits}
                    </span>
                    {customer.lastVisit ? (
                      <span className="block">
                        {t("lastVisit")}: {formatDate(customer.lastVisit.getTime(), locale, timeZone, "short")}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
