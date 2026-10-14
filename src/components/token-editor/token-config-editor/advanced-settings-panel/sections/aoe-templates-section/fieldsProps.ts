import { AoeTuning } from "@/core/token/catalog/token-items/tokenItem";

export type AoeFieldsProps = {
  aoe: AoeTuning;
  onChange: (aoe: AoeTuning) => void;
};
