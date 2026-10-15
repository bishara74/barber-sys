import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { moveItem, type SortableList } from "@/actions/sort";
import { SubmitButton } from "@/components/ui/action-form";
import { cn } from "@/lib/utils";

type MoveButtonsProps = { list: SortableList; id: number; isFirst: boolean; isLast: boolean; vertical?: boolean };

/** Up/down buttons to reorder an item in a list. */
export function MoveButtons({ list, id, isFirst, isLast, vertical }: MoveButtonsProps) {
  const t = useTranslations("common");
  const buttonClass = "text-muted hover:text-foreground";
  return (
    <form action={moveItem} className={cn("flex shrink-0", vertical && "flex-col")}>
      <input type="hidden" name="list" value={list} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        variant="ghost"
        size="icon-sm"
        name="direction"
        value="up"
        aria-label={t("moveUp")}
        className={cn(buttonClass, isFirst && "invisible")}
      >
        <ChevronUp className="size-4" />
      </SubmitButton>
      <SubmitButton
        variant="ghost"
        size="icon-sm"
        name="direction"
        value="down"
        aria-label={t("moveDown")}
        className={cn(buttonClass, isLast && "invisible")}
      >
        <ChevronDown className="size-4" />
      </SubmitButton>
    </form>
  );
}
