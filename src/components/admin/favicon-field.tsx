"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormResult } from "@/components/ui/action-form";
import { Checkbox } from "@/components/ui/field";
import { ImageInput } from "@/components/ui/image-input";

type FaviconFieldProps = {
  /** The shop's own icon, if one was uploaded. */
  iconUrl?: string;
  /** What browsers show without an own icon: the logo, or the generated initial. */
  fallbackUrl: string;
  shopName: string;
};

/** Upload for the browser tab icon, with a preview of how the tab looks. */
export function FaviconField({ iconUrl, fallbackUrl, shopName }: FaviconFieldProps) {
  const t = useTranslations("admin.profile");
  const result = useFormResult();
  // Both are about the next save; once the form has saved, the saved icon shows.
  const [picked, setPicked] = useState({ url: null as string | null, result });
  const [removal, setRemoval] = useState({ checked: false, result });
  const current = (choice: { result: typeof result }) => choice.result === result || result.status !== "success";
  const preview = current(picked) ? picked.url : null;
  const removing = current(removal) && removal.checked;
  // An upload wins over "remove", like on the server.
  const shown = preview ?? (iconUrl && !removing ? iconUrl : fallbackUrl);

  return (
    <div className="space-y-3">
      <ImageInput
        name="favicon"
        label={t("favicon")}
        hint={t("faviconHint")}
        currentUrl={iconUrl}
        previewClassName="size-14 w-14 rounded-xl"
        maxSide={256}
        square
        format="png"
        onPreview={(url) => setPicked({ url, result })}
      />
      {iconUrl ? (
        <Checkbox
          name="removeFavicon"
          label={t("removeImage")}
          onChange={(event) => setRemoval({ checked: event.target.checked, result })}
        />
      ) : null}

      {/* A browser tab, to see the icon at its real size. */}
      <div className="overflow-hidden rounded-theme border border-border bg-accent shadow-xs" aria-hidden>
        <div className="flex items-end gap-1 px-2 pt-2">
          <div className="flex max-w-60 min-w-0 items-center gap-2 rounded-t-lg bg-card px-3 py-2 text-xs shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt="" className="size-4 shrink-0 rounded-[3px] object-cover" />
            <span className="min-w-0 flex-1 truncate font-medium">{shopName}</span>
            <X className="size-3 shrink-0 text-muted" />
          </div>
          <Plus className="mb-2 size-3.5 text-muted" />
        </div>
        <div className="flex items-center gap-2 bg-card px-3 py-2">
          <span className="h-5 flex-1 rounded-full bg-accent" />
        </div>
      </div>
      <p className="text-xs text-muted">{t("tabPreview")}</p>
    </div>
  );
}
