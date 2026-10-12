"use client";

import { useTranslations } from "next-intl";
import { changeBookingStatus } from "@/actions/bookings";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import type { ButtonVariant } from "@/components/ui/button";
import type { BookingStatus } from "@/db/schema";

type Action = { status: string; label: string; variant: ButtonVariant; confirm?: string };

/** The status buttons that make sense for a booking in its current state. */
export function StatusActions({ id, status }: { id: number; status: BookingStatus }) {
  const t = useTranslations("admin.booking");

  const actions: Action[] =
    status === "pending"
      ? [
          { status: "confirmed", label: t("approve"), variant: "primary" },
          { status: "declined", label: t("decline"), variant: "outline", confirm: t("declineConfirm") },
        ]
      : status === "confirmed"
        ? [
            { status: "completed", label: t("complete"), variant: "primary" },
            { status: "no_show", label: t("noShow"), variant: "outline" },
            { status: "cancelled", label: t("cancel"), variant: "outline", confirm: t("cancelConfirm") },
          ]
        : [];

  if (actions.length === 0) return null;

  return (
    <ActionForm action={changeBookingStatus} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <SubmitButton
            key={action.status}
            name="status"
            value={action.status}
            variant={action.variant}
            confirm={action.confirm}
          >
            {action.label}
          </SubmitButton>
        ))}
      </div>
    </ActionForm>
  );
}
