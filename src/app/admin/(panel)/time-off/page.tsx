import { Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { addTimeOff, deleteTimeOff } from "@/actions/time-off";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { EmptyState, PageHeader, Section } from "@/components/ui/card";
import { InputField, SelectField } from "@/components/ui/field";
import { getTimeOffInRange } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { getActiveStaff } from "@/lib/catalog";
import { getDeploymentConfig } from "@/lib/env";
import { requestTime } from "@/lib/request";
import { addDays, DAY, formatDate, formatTime, localDate } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.timeOff");
  return { title: t("title") };
}

export default async function TimeOffPage() {
  const user = await requireUser();
  const { timeZone } = getDeploymentConfig();
  const now = requestTime();
  const [locale, t, tc, staff, upcoming] = await Promise.all([
    getLocale(),
    getTranslations("admin.timeOff"),
    getTranslations("common"),
    getActiveStaff(),
    getTimeOffInRange({ from: now, to: now + 365 * DAY, staffId: null }),
  ]);

  const isOwner = user.role === "owner";
  const choices = isOwner
    ? [{ value: "", label: t("wholeShop") }, ...staff.map((member) => ({ value: member.id, label: member.name }))]
    : staff.filter((member) => member.id === user.staffId).map((member) => ({ value: member.id, label: member.name }));
  const visible = isOwner ? upcoming : upcoming.filter((block) => block.staffId === user.staffId);
  const tomorrow = addDays(localDate(now, timeZone), 1);
  const when = (date: Date) =>
    `${formatDate(date.getTime(), locale, timeZone, "short")} ${formatTime(date.getTime(), locale, timeZone)}`;

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={t("add")} description={t("description")}>
          <ActionForm action={addTimeOff} resetOnSuccess>
            <SelectField label={t("staff")} name="staffId" options={choices} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label={t("from")} name="startsAt" type="datetime-local" step={300} required defaultValue={`${tomorrow}T00:00`} />
              <InputField label={t("to")} name="endsAt" type="datetime-local" step={300} required defaultValue={`${addDays(tomorrow, 1)}T00:00`} />
            </div>
            <InputField label={t("reason")} name="reason" placeholder={t("reasonPlaceholder")} maxLength={200} />
            <SubmitButton>{t("add")}</SubmitButton>
          </ActionForm>
        </Section>

        <Section title={t("upcoming")}>
          {visible.length === 0 ? (
            <EmptyState>{t("none")}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((block) => (
                <li key={block.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">
                      {block.staffId === null ? t("wholeShop") : staff.find((m) => m.id === block.staffId)?.name}
                      {block.reason ? ` · ${block.reason}` : ""}
                    </p>
                    <p className="text-muted" dir="ltr">
                      {when(block.startsAt)} → {when(block.endsAt)}
                    </p>
                  </div>
                  <form action={deleteTimeOff}>
                    <input type="hidden" name="id" value={block.id} />
                    <SubmitButton variant="ghost" size="icon" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
                      <Trash2 className="size-4" />
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
