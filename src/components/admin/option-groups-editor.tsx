import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteOption, deleteOptionGroup, saveOption, saveOptionGroup } from "@/actions/catalog";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, InputField, SelectField } from "@/components/ui/field";
import type { Option } from "@/db/schema";
import type { CatalogGroup } from "@/lib/catalog";
import { moneyInputValue } from "@/lib/money";
import { BilingualFields } from "./bilingual-fields";
import { MoveButtons } from "./move-buttons";

/** Option groups of a service, each with its options: add-ons and choices with extra price and time. */
export function OptionGroupsEditor({ serviceId, groups }: { serviceId: number; groups: CatalogGroup[] }) {
  const t = useTranslations("admin.services");
  const tc = useTranslations("common");

  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <div key={group.id} className="space-y-4 rounded-theme border border-border p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <GroupForm serviceId={serviceId} group={group} />
            <div className="flex flex-col items-center">
              <MoveButtons list="optionGroup" id={group.id} isFirst={index === 0} isLast={index === groups.length - 1} />
              <form action={deleteOptionGroup}>
                <input type="hidden" name="id" value={group.id} />
                <SubmitButton variant="ghost" size="icon" aria-label={t("deleteGroup")} confirm={tc("confirmDelete")}>
                  <Trash2 className="size-4" />
                </SubmitButton>
              </form>
            </div>
          </div>

          <ul className="space-y-2 border-t border-border pt-3">
            {group.options.map((option, optionIndex) => (
              <li key={option.id} className="flex items-start gap-2">
                <OptionForm groupId={group.id} option={option} />
                <div className="flex items-center">
                  <MoveButtons
                    list="option"
                    id={option.id}
                    isFirst={optionIndex === 0}
                    isLast={optionIndex === group.options.length - 1}
                  />
                  <form action={deleteOption}>
                    <input type="hidden" name="id" value={option.id} />
                    <SubmitButton variant="ghost" size="icon" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
                      <Trash2 className="size-4" />
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
            <li>
              <OptionForm groupId={group.id} />
            </li>
          </ul>
        </div>
      ))}

      <div className="rounded-theme border border-dashed border-border p-3 sm:p-4">
        <GroupForm serviceId={serviceId} />
      </div>
    </div>
  );
}

function GroupForm({ serviceId, group }: { serviceId: number; group?: CatalogGroup }) {
  const t = useTranslations("admin.services");
  const tc = useTranslations("common");
  return (
    <ActionForm action={saveOptionGroup} resetOnSuccess={!group} className="min-w-0 flex-1">
      <input type="hidden" name="serviceId" value={serviceId} />
      {group ? <input type="hidden" name="id" value={group.id} /> : null}
      <BilingualFields name="name" label={t("groupName")} defaults={{ en: group?.nameEn, ar: group?.nameAr }} />
      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          label={t("selection")}
          name="selection"
          defaultValue={group?.selection ?? "multiple"}
          options={[
            { value: "multiple", label: t("selectionMultiple") },
            { value: "single", label: t("selectionSingle") },
          ]}
        />
        <Checkbox name="isRequired" label={t("groupRequired")} defaultChecked={group?.isRequired ?? false} className="pb-2.5" />
        <SubmitButton variant={group ? "outline" : "secondary"} size="sm" className="mb-1">
          {group ? (
            tc("save")
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              {t("addGroup")}
            </>
          )}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

function OptionForm({ groupId, option }: { groupId: number; option?: Option }) {
  const t = useTranslations("admin.services");
  const tc = useTranslations("common");
  return (
    <ActionForm
      action={saveOption}
      resetOnSuccess={!option}
      className="grid min-w-0 flex-1 grid-cols-2 items-end gap-2 space-y-0 sm:grid-cols-[1fr_1fr_6rem_6rem_auto]"
    >
      <input type="hidden" name="groupId" value={groupId} />
      {option ? <input type="hidden" name="id" value={option.id} /> : null}
      <InputField label={`${t("optionName")} (${tc("english")})`} name="nameEn" defaultValue={option?.nameEn} dir="ltr" maxLength={120} />
      <InputField label={`${t("optionName")} (${tc("arabic")})`} name="nameAr" defaultValue={option?.nameAr} dir="rtl" maxLength={120} />
      <InputField
        label={t("extraPrice")}
        name="priceDelta"
        inputMode="decimal"
        defaultValue={option ? moneyInputValue(option.priceDelta) : "0"}
      />
      <InputField
        label={t("extraTime")}
        name="durationDelta"
        type="number"
        step={5}
        defaultValue={option?.durationDelta ?? 0}
      />
      <SubmitButton variant={option ? "outline" : "secondary"} size="sm" className="mb-1">
        {option ? tc("save") : <Plus className="size-4" aria-label={t("addOption")} />}
      </SubmitButton>
    </ActionForm>
  );
}
