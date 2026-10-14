import { SelectFieldOption } from "@/components/primitives/select-field/SelectField";
import { ReliefStyle } from "@/core/token/types";

export const RELIEF_OPTIONS: SelectFieldOption<ReliefStyle>[] = [
  { value: "raised", label: "Raised" },
  { value: "engraved", label: "Engraved" },
  { value: "inlay", label: "Flat inlay (multicolor)" },
];
