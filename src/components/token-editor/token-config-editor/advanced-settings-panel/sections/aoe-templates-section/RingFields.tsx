import { NumberField } from "@/components/primitives/number-field/NumberField";

import { TEXT_SIZE_BOUNDS } from "../shared/fieldBounds";
import { BandWidthField } from "./BandWidthField";
import type { AoeFieldsProps } from "./fieldsProps";

export const RingFields = ({ aoe, onChange }: AoeFieldsProps) => (
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
