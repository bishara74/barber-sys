import { localized, type Locale } from "@/i18n/locales";
import type { OptionSelection } from "@/db/schema";

/** The catalog in one language, shaped for client components (booking wizard, shop booking form). */
export type ViewOption = { id: number; name: string; priceDelta: number; durationDelta: number };
export type ViewGroup = {
  id: number;
  name: string;
  selection: OptionSelection;
  isRequired: boolean;
  options: ViewOption[];
};
export type ViewService = {
  id: number;
  name: string;
  description: string;
  price: number | null;
  priceIsFrom: boolean;
  durationMin: number;
  groups: ViewGroup[];
  staffIds: number[];
};
export type ViewType = { id: number; name: string; services: ViewService[] };

type Bilingual = { nameEn: string; nameAr: string };
type SourceType = Bilingual & {
  id: number;
  services: (Bilingual & {
    id: number;
    descriptionEn: string;
    descriptionAr: string;
    price: number | null;
    priceIsFrom: boolean;
    durationMin: number;
    staffIds: number[];
    groups: (Bilingual & {
      id: number;
      selection: OptionSelection;
      isRequired: boolean;
      options: (Bilingual & { id: number; priceDelta: number; durationDelta: number })[];
    })[];
  })[];
};

export function catalogView(catalog: SourceType[], locale: Locale): ViewType[] {
  const name = (item: Bilingual) => localized(locale, item.nameEn, item.nameAr);
  return catalog.map((type) => ({
    id: type.id,
    name: name(type),
    services: type.services.map((service) => ({
      id: service.id,
      name: name(service),
      description: localized(locale, service.descriptionEn, service.descriptionAr),
      price: service.price,
      priceIsFrom: service.priceIsFrom,
      durationMin: service.durationMin,
      staffIds: service.staffIds,
      groups: service.groups
        .filter((group) => group.options.length > 0)
        .map((group) => ({
          id: group.id,
          name: name(group),
          selection: group.selection,
          isRequired: group.isRequired,
          options: group.options.map((option) => ({
            id: option.id,
            name: name(option),
            priceDelta: option.priceDelta,
            durationDelta: option.durationDelta,
          })),
        })),
    })),
  }));
}
