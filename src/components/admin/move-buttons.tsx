import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { moveItem, type SortableList } from "@/actions/sort";
import { SubmitButton } from "@/components/ui/action-form";

type MoveButtonsProps = { list: SortableList; id: number; isFirst: boolean; isLast: boolean };

/** Up/down buttons to reorder an item in a list. */
export function MoveButtons({ list, id, isFirst, isLast }: MoveButtonsProps) {
  const t = useTranslations("common");
  return (
    <form action={moveItem} className="flex shrink-0">
      <input type="hidden" name="list" value={list} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost" size="icon" name="direction" value="up" aria-label={t("moveUp")} className={isFirst ? "invisible" : ""}>
        <ChevronUp className="size-4" />
      </SubmitButton>
      <SubmitButton variant="ghost" size="icon" name="direction" value="down" aria-label={t("moveDown")} className={isLast ? "invisible" : ""}>
        <ChevronDown className="size-4" />
      </SubmitButton>
    </form>
  );
}
