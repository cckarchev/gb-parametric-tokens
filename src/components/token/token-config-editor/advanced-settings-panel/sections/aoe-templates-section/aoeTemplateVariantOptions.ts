import { SelectFieldOption } from "@/components/primitives/select-field/SelectField";
import { AoeTemplateVariant } from "@/core/token/catalog/tokenItems/tokenItem";

export const AOE_TEMPLATE_VARIANT_OPTIONS: SelectFieldOption<AoeTemplateVariant>[] = [
  { value: "ring", label: "Full 3″ ring" },
  { value: "compactDisc", label: "Compact 1″ disc" },
  { value: "crowfoot", label: "Crow's foot (3″ arcs)" },
];
