import { ReliefStyle } from "../../core/token/types";
import { SelectFieldOption } from "../primitives/SelectField/SelectField";

export const RELIEF_OPTIONS: SelectFieldOption<ReliefStyle>[] = [
  { value: "raised", label: "Raised" },
  { value: "engraved", label: "Engraved" },
];
