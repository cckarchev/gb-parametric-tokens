import { NumberField } from "@/components/primitives/number-field/NumberField";

import { BAND_WIDTH_BOUNDS } from "../shared/fieldBounds";
import { AoeFieldsProps } from "./aoeFieldsProps";

export const BandWidthField = ({ aoe, onChange }: AoeFieldsProps) => {
  return (
    <NumberField
      label="Band width (mm)"
      value={aoe.bandWidthMm}
      {...BAND_WIDTH_BOUNDS}
      onChange={(bandWidthMm) => onChange({ ...aoe, bandWidthMm })}
    />
  );
};
