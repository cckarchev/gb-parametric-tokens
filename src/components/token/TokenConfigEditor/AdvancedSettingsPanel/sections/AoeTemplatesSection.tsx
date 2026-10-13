import { DEFAULT_SHARED_CONFIG } from "../../../../../core/token/catalog/tokenItems/defaultSharedConfig";
import { AoeTuning, CrowfootTuning } from "../../../../../core/token/catalog/tokenItems/tokenItem";
import { AOE_TEMPLATE_VARIANT_OPTIONS } from "../../../../editor/aoeTemplateVariantOptions";
import {
  ARC_SWEEP_BOUNDS,
  BAND_WIDTH_BOUNDS,
  CORNER_RADIUS_BOUNDS,
  CREST_SCALE_BOUNDS,
  FILLET_RADIUS_BOUNDS,
  INSET_BOUNDS,
  SPOKE_COUNT_BOUNDS,
  SPOKE_TEXT_CLEARANCE_BOUNDS,
  SPOKE_TEXT_MARGIN_BOUNDS,
  SPOKE_WIDTH_BOUNDS,
  TEXT_SIZE_BOUNDS,
} from "../../../../editor/fieldBounds";
import { CheckboxField } from "../../../../primitives/CheckboxField/CheckboxField";
import { NumberField } from "../../../../primitives/NumberField/NumberField";
import { PercentField } from "../../../../primitives/PercentField/PercentField";
import { SelectField } from "../../../../primitives/SelectField/SelectField";
import { SectionPanel, SectionProps } from "./SectionPanel/SectionPanel";

type AoeFieldsProps = {
  aoe: AoeTuning;
  onChange: (aoe: AoeTuning) => void;
};

const BandWidthField = ({ aoe, onChange }: AoeFieldsProps) => {
  return (
    <NumberField
      label="Band width (mm)"
      value={aoe.bandWidthMm}
      {...BAND_WIDTH_BOUNDS}
      onChange={(bandWidthMm) => onChange({ ...aoe, bandWidthMm })}
    />
  );
};

const RingFields = ({ aoe, onChange }: AoeFieldsProps) => {
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

const CompactDiscFields = ({ aoe, onChange }: AoeFieldsProps) => {
  const { compactDisc } = aoe;

  return (
    <>
      <NumberField
        label="Text size (mm)"
        value={compactDisc.textSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(textSizeMm) => onChange({ ...aoe, compactDisc: { ...compactDisc, textSizeMm } })}
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
        onChange={(crestScale) => onChange({ ...aoe, compactDisc: { ...compactDisc, crestScale } })}
      />
    </>
  );
};

const CrowfootFields = ({ aoe, onChange }: AoeFieldsProps) => {
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

// The variant selector, then only the selected variant's fields. The 3″ and 1″ diameters are
// game rules, not settings, so they never appear here.
export const AoeTemplatesSection = ({ sharedConfig, onChange }: SectionProps) => {
  const { aoe, aoeTemplateVariant } = sharedConfig;

  // The variant is a choice of what to print, not a tuning value, so the reset keeps it.
  const reset = () => {
    onChange({ ...sharedConfig, aoe: DEFAULT_SHARED_CONFIG.aoe });
  };

  const updateAoe = (nextAoe: AoeTuning) => {
    onChange({ ...sharedConfig, aoe: nextAoe });
  };

  return (
    <SectionPanel title="AOE templates" onReset={reset}>
      <SelectField
        label="AOE templates"
        value={aoeTemplateVariant}
        options={AOE_TEMPLATE_VARIANT_OPTIONS}
        onChange={(variant) => onChange({ ...sharedConfig, aoeTemplateVariant: variant })}
      />

      {aoeTemplateVariant === "ring" && <RingFields aoe={aoe} onChange={updateAoe} />}
      {aoeTemplateVariant === "compactDisc" && <CompactDiscFields aoe={aoe} onChange={updateAoe} />}
      {aoeTemplateVariant === "crowfoot" && <CrowfootFields aoe={aoe} onChange={updateAoe} />}
    </SectionPanel>
  );
};
