import { NumberField } from "@/components/primitives/number-field/NumberField";
import { PercentField } from "@/components/primitives/PercentField";

import {
  CREST_SCALE_BOUNDS,
  INSET_BOUNDS,
  TEXT_SIZE_BOUNDS,
} from "../shared/fieldBounds";
import type { AoeFieldsProps } from "./fieldsProps";

export const CompactDiscFields = ({ aoe, onChange }: AoeFieldsProps) => {
  const { compactDisc } = aoe;

  return (
    <>
      <NumberField
        label="Text size (mm)"
        value={compactDisc.textSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(textSizeMm) =>
          onChange({ ...aoe, compactDisc: { ...compactDisc, textSizeMm } })
        }
      />
      <NumberField
        label="Text inset from rim (mm)"
        value={compactDisc.textInsetMm}
        {...INSET_BOUNDS}
        onChange={(textInsetMm) =>
          onChange({ ...aoe, compactDisc: { ...compactDisc, textInsetMm } })
        }
      />
      <PercentField
        label="Crest size (%)"
        value={compactDisc.crestScale}
        {...CREST_SCALE_BOUNDS}
        onChange={(crestScale) =>
          onChange({ ...aoe, compactDisc: { ...compactDisc, crestScale } })
        }
      />
    </>
  );
};
