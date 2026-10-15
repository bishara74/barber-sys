"use client";

import { Ban, Check, CheckCheck, UserX, X, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { changeBookingStatus } from "@/actions/bookings";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import type { ButtonVariant } from "@/components/ui/button";
import type { BookingStatus } from "@/db/schema";

type Action = { status: string; label: string; variant: ButtonVariant; icon: LucideIcon; confirm?: string };

type StatusActionsProps = {
  id: number;
  status: BookingStatus;
  /** Smaller buttons, for lists. */
  compact?: boolean;
};

/** The status buttons that make sense for a booking in its current state. */
export function StatusActions({ id, status, compact }: StatusActionsProps) {
  const t = useTranslations("admin.booking");

  const actions: Action[] =
    status === "pending"
      ? [
          { status: "confirmed", label: t("approve"), variant: "primary", icon: Check },
          { status: "declined", label: t("decline"), variant: "outline", icon: X, confirm: t("declineConfirm") },
        ]
      : status === "confirmed"
        ? [
            { status: "completed", label: t("complete"), variant: "primary", icon: CheckCheck },
            { status: "no_show", label: t("noShow"), variant: "outline", icon: UserX },
            { status: "cancelled", label: t("cancel"), variant: "danger-ghost", icon: Ban, confirm: t("cancelConfirm") },
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
            size={compact ? "sm" : "md"}
            confirm={action.confirm}
          >
            <action.icon className="size-4" aria-hidden />
            {action.label}
          </SubmitButton>
        ))}
      </div>
    </ActionForm>
  );
}
