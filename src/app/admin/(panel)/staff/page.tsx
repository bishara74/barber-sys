import { Plus, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createStaff } from "@/actions/staff";
import { MoveButtons } from "@/components/admin/move-buttons";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Badge, EmptyState, PageHeader, Section } from "@/components/ui/card";
import { InputField } from "@/components/ui/field";
import { requireOwner } from "@/lib/auth";
import { getStaff } from "@/lib/catalog";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.staff");
  return { title: t("title") };
}

export default async function StaffPage() {
  await requireOwner();
  const [t, staff] = await Promise.all([getTranslations("admin.staff"), getStaff()]);

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <Section title={t("title")}>
          {staff.length === 0 ? (
            <EmptyState>{t("noStaff")}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {staff.map((member, index) => (
                <li key={member.id} className="flex items-center gap-3 py-2">
                  <Link href={`/admin/staff/${member.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-theme p-1 hover:bg-accent">
                    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
                      {member.avatarKey ? (
                        <Image src={mediaUrl(member.avatarKey)} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <UserRound className="size-5 text-muted" aria-hidden />
                      )}
                    </span>
                    <span className="truncate font-medium">{member.name}</span>
                    {!member.isActive ? <Badge>{t("inactive")}</Badge> : null}
                  </Link>
                  <MoveButtons list="staff" id={member.id} isFirst={index === 0} isLast={index === staff.length - 1} />
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title={t("add")}>
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
