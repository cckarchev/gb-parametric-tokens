import { TEXT_SIZE_BOUNDS } from "@/components/editor/fieldBounds";
import { NumberField } from "@/components/primitives/number-field/NumberField";

import { AoeFieldsProps } from "./aoeFieldsProps";
import { BandWidthField } from "./BandWidthField";

export const RingFields = ({ aoe, onChange }: AoeFieldsProps) => {
  return (
    <>
      <BandWidthField aoe={aoe} onChange={onChange} />
      <NumberField
        label="Text size (mm)"
        value={aoe.ring.textSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(textSizeMm) => onChange({ ...aoe, ring: { textSizeMm } })}
      />
    </>
  );
};
