import { SelectFieldOption } from "@/components/primitives/select-field/SelectField";
import { IconOverflowBehavior } from "@/core/token/types";

export const ICON_OVERFLOW_BEHAVIOR_OPTIONS: SelectFieldOption<IconOverflowBehavior>[] = [
  { value: "none", label: "None" },
  { value: "shrink", label: "Shrink" },
  { value: "trim", label: "Trim" },
  { value: "grow", label: "Grow" },
];
