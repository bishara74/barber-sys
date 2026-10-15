import { ArrowRight, CalendarOff, CalendarRange, Plus, Store, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { addTimeOff, deleteTimeOff } from "@/actions/time-off";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Avatar, EmptyState, PageHeader, Section } from "@/components/ui/card";
import { InputField, SelectField } from "@/components/ui/field";
import { getTimeOffInRange } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { getActiveStaff } from "@/lib/catalog";
import { getDeploymentConfig } from "@/lib/env";
import { requestTime } from "@/lib/request";
import { addDays, DAY, formatDate, formatTime, localDate } from "@/lib/time";
import { mediaUrl, stagger } from "@/lib/utils";

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
  const when = (date: Date) => (
    <>
      <span className="font-medium text-foreground">{formatDate(date.getTime(), locale, timeZone, "short")}</span>{" "}
      <span dir="ltr" className="tabular-nums">
        {formatTime(date.getTime(), locale, timeZone)}
      </span>
    </>
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={t("add")} icon={Plus} className="lg:self-start">
          <ActionForm action={addTimeOff} resetOnSuccess>
            <SelectField label={t("staff")} name="staffId" options={choices} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label={t("from")} name="startsAt" type="datetime-local" step={300} required defaultValue={`${tomorrow}T00:00`} />
              <InputField label={t("to")} name="endsAt" type="datetime-local" step={300} required defaultValue={`${addDays(tomorrow, 1)}T00:00`} />
            </div>
            <InputField label={t("reason")} name="reason" placeholder={t("reasonPlaceholder")} maxLength={200} />
            <SubmitButton>
              <CalendarOff className="size-4" aria-hidden />
              {t("add")}
            </SubmitButton>
          </ActionForm>
        </Section>

        <Section title={t("upcoming")} icon={CalendarRange} className="lg:self-start">
          {visible.length === 0 ? (
            <EmptyState icon={CalendarOff}>{t("none")}</EmptyState>
          ) : (
            <ul className="space-y-2.5">
              {visible.map((block, index) => {
                const member = staff.find((candidate) => candidate.id === block.staffId);
                return (
                  <li
                    key={block.id}
                    style={stagger(index)}
                    className="flex animate-fade-up items-start gap-3 rounded-theme border border-border bg-surface/40 p-3"
                  >
                    {block.staffId === null ? (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Store className="size-5" aria-hidden />
                      </span>
                    ) : (
                      <Avatar
                        name={member?.name ?? "?"}
                        src={member?.avatarKey ? mediaUrl(member.avatarKey) : null}
                        className="size-10 text-xs"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {block.staffId === null ? t("wholeShop") : member?.name}
                        {block.reason ? <span className="font-normal text-muted"> · {block.reason}</span> : null}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
                        {when(block.startsAt)}
                        <ArrowRight className="size-3.5 shrink-0 rtl:-scale-x-100" aria-hidden />
                        {when(block.endsAt)}
                      </p>
                    </div>
                    <form action={deleteTimeOff}>
                      <input type="hidden" name="id" value={block.id} />
                      <SubmitButton variant="danger-ghost" size="icon-sm" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
                        <Trash2 className="size-4" />
                      </SubmitButton>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
