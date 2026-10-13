import { AoeTemplateVariant } from "../../core/token/catalog/tokenItems/tokenItem";
import { SelectFieldOption } from "../primitives/SelectField/SelectField";

export const AOE_TEMPLATE_VARIANT_OPTIONS: SelectFieldOption<AoeTemplateVariant>[] = [
  { value: "ring", label: "Full 3″ ring" },
  { value: "compactDisc", label: "Compact 1″ disc" },
];
