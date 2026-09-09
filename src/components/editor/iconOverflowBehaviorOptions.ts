import { IconOverflowBehavior } from "../../core/token/types";
import { SelectFieldOption } from "../primitives/SelectField/SelectField";

export const ICON_OVERFLOW_BEHAVIOR_OPTIONS: SelectFieldOption<IconOverflowBehavior>[] = [
  { value: "none", label: "None" },
  { value: "shrink", label: "Shrink" },
  { value: "trim", label: "Trim" },
  { value: "grow", label: "Grow" },
];
