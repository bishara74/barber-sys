import { ChevronRight, Plus, Scissors, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createStaff } from "@/actions/staff";
import { MoveButtons } from "@/components/admin/move-buttons";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Avatar, Badge, EmptyState, PageHeader, Section } from "@/components/ui/card";
import { InputField } from "@/components/ui/field";
import { requireOwner } from "@/lib/auth";
import { getStaff } from "@/lib/catalog";
import { cn, mediaUrl, stagger } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.staff");
  return { title: t("title") };
}

export default async function StaffPage() {
  await requireOwner();
  const [t, staff] = await Promise.all([getTranslations("admin.staff"), getStaff()]);

  return (
    <>
      <PageHeader title={t("title")} description={t("pageHint")} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          {staff.length === 0 ? (
            <EmptyState icon={Users}>{t("noStaff")}</EmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {staff.map((member, index) => (
                <li
                  key={member.id}
                  style={stagger(index)}
                  className={cn(
                    "group flex animate-fade-up items-center gap-2 rounded-theme border border-border bg-card p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift",
                    !member.isActive && "opacity-70",
                  )}
                >
                  <Link href={`/admin/staff/${member.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar
                      name={member.name}
                      src={member.avatarKey ? mediaUrl(member.avatarKey) : null}
                      className="size-12 text-base"
                      sizes="48px"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold group-hover:text-primary">{member.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        {member.isActive ? (
                          <Badge tone="success" dot>
                            {t("active")}
                          </Badge>
                        ) : (
                          <Badge dot>{t("inactive")}</Badge>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Scissors className="size-3" aria-hidden />
                          {t("servicesCount", { count: member.serviceIds.length })}
                        </span>
                      </span>
                    </span>
                    <ChevronRight
                      className="ms-auto size-4 shrink-0 text-muted transition group-hover:text-primary rtl:-scale-x-100"
                      aria-hidden
                    />
                  </Link>
                  <MoveButtons list="staff" id={member.id} isFirst={index === 0} isLast={index === staff.length - 1} vertical />
                </li>
              ))}
            </ul>
          )}
        </div>
        <Section title={t("add")} icon={UserPlus} description={t("addHint")} className="lg:self-start">
          <ActionForm action={createStaff}>
            <InputField label={t("name")} name="name" required maxLength={80} />
            <SubmitButton>
              <Plus className="size-4" aria-hidden />
              {t("add")}
            </SubmitButton>
          </ActionForm>
        </Section>
      </div>
    </>
  );
}
