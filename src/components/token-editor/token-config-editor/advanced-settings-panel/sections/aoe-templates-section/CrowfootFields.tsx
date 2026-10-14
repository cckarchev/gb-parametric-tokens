import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import { CrowfootTuning } from "@/core/token/catalog/tokenItems/tokenItem";

import {
  ARC_SWEEP_BOUNDS,
  CORNER_RADIUS_BOUNDS,
  FILLET_RADIUS_BOUNDS,
  SPOKE_COUNT_BOUNDS,
  SPOKE_TEXT_CLEARANCE_BOUNDS,
  SPOKE_TEXT_MARGIN_BOUNDS,
  SPOKE_WIDTH_BOUNDS,
  TEXT_SIZE_BOUNDS,
} from "../shared/fieldBounds";
import { BandWidthField } from "./BandWidthField";
import { AoeFieldsProps } from "./fieldsProps";

export const CrowfootFields = ({ aoe, onChange }: AoeFieldsProps) => {
  const { crowfoot } = aoe;

  const updateCrowfoot = (changes: Partial<CrowfootTuning>) => {
    onChange({ ...aoe, crowfoot: { ...crowfoot, ...changes } });
  };

  return (
    <>
      <BandWidthField aoe={aoe} onChange={onChange} />
      <NumberField
        label="Spoke count"
        value={crowfoot.spokeCount}
        {...SPOKE_COUNT_BOUNDS}
        stepper={true}
        onChange={(spokeCount) => updateCrowfoot({ spokeCount })}
      />
      <NumberField
        label="Spoke width (mm)"
        value={crowfoot.spokeWidthMm}
        {...SPOKE_WIDTH_BOUNDS}
        onChange={(spokeWidthMm) => updateCrowfoot({ spokeWidthMm })}
      />
      <NumberField
        label="Arc sweep (°)"
        value={crowfoot.arcSweepDeg}
        {...ARC_SWEEP_BOUNDS}
        onChange={(arcSweepDeg) => updateCrowfoot({ arcSweepDeg })}
      />
      <NumberField
        label="Arc end rounding (mm)"
        value={crowfoot.cornerRadiusMm}
        {...CORNER_RADIUS_BOUNDS}
        onChange={(cornerRadiusMm) => updateCrowfoot({ cornerRadiusMm })}
      />
      <CheckboxField
        label="Fillet inside corners"
        checked={crowfoot.filletEnabled}
        onChange={(filletEnabled) => updateCrowfoot({ filletEnabled })}
      />
      <NumberField
        label="Fillet radius (mm)"
        value={crowfoot.filletRadiusMm}
        {...FILLET_RADIUS_BOUNDS}
        disabled={!crowfoot.filletEnabled}
        onChange={(filletRadiusMm) => updateCrowfoot({ filletRadiusMm })}
      />
      <NumberField
        label="Text size (mm)"
        value={crowfoot.textSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(textSizeMm) => updateCrowfoot({ textSizeMm })}
      />
      <NumberField
        label="Spoke text clearance from center (mm)"
        value={crowfoot.spokeTextCenterClearanceMm}
        {...SPOKE_TEXT_CLEARANCE_BOUNDS}
        onChange={(spokeTextCenterClearanceMm) => updateCrowfoot({ spokeTextCenterClearanceMm })}
      />
      <NumberField
        label="Spoke text margin before arc (mm)"
        value={crowfoot.spokeTextBandMarginMm}
        {...SPOKE_TEXT_MARGIN_BOUNDS}
        onChange={(spokeTextBandMarginMm) => updateCrowfoot({ spokeTextBandMarginMm })}
      />
    </>
  );
};
