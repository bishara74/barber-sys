"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/field";

type StaffFilterProps = { staff: { id: number; name: string }[]; value: number | null };

export function StaffFilter({ staff, value }: StaffFilterProps) {
  const t = useTranslations("admin.calendar");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      aria-label={t("allStaff")}
      className="w-auto"
      value={value ?? ""}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams);
        if (event.target.value) params.set("staff", event.target.value);
        else params.delete("staff");
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      <option value="">{t("allStaff")}</option>
      {staff.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </Select>
  );
}
