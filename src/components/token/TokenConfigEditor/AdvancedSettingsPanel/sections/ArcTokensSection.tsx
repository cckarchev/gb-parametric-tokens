import { DEFAULT_SHARED_CONFIG } from "../../../../../core/token/catalog/tokenItems/defaultSharedConfig";
import {
  BALANCE_SCALE_BOUNDS,
  CREST_SCALE_BOUNDS,
  TEXT_SIZE_BOUNDS,
} from "../../../../editor/fieldBounds";
import { ShapeEditor } from "../../../../editor/ShapeEditor/ShapeEditor";
import { NumberField } from "../../../../primitives/NumberField/NumberField";
import { PercentField } from "../../../../primitives/PercentField/PercentField";
import { SectionPanel, SectionProps } from "./SectionPanel/SectionPanel";

export const ArcTokensSection = ({ sharedConfig, onChange }: SectionProps) => {
  const { characterToken } = sharedConfig;
  const balanceDisabled = !sharedConfig.balanceTwoLineSizes;

  const reset = () => {
    onChange({
      ...sharedConfig,
      arcShape: DEFAULT_SHARED_CONFIG.arcShape,
      nameSizeMm: DEFAULT_SHARED_CONFIG.nameSizeMm,
      effectSizeMm: DEFAULT_SHARED_CONFIG.effectSizeMm,
      characterToken: DEFAULT_SHARED_CONFIG.characterToken,
    });
  };

  return (
    <SectionPanel title="Arc tokens" onReset={reset}>
      <ShapeEditor
        shape={sharedConfig.arcShape}
        onChange={(arcShape) => onChange({ ...sharedConfig, arcShape })}
      />

      <NumberField
        label="Name size (mm)"
        value={sharedConfig.nameSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(nameSizeMm) => onChange({ ...sharedConfig, nameSizeMm })}
      />
      <NumberField
        label="Effect size (mm)"
        value={sharedConfig.effectSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(effectSizeMm) => onChange({ ...sharedConfig, effectSizeMm })}
      />
      <PercentField
        label="Crest size (%)"
        value={characterToken.crestScale}
        {...CREST_SCALE_BOUNDS}
        onChange={(crestScale) =>
          onChange({ ...sharedConfig, characterToken: { ...characterToken, crestScale } })
        }
      />
      <PercentField
        label="Balanced name size (%)"
        value={characterToken.balanceNameScale}
        {...BALANCE_SCALE_BOUNDS}
        disabled={balanceDisabled}
        onChange={(balanceNameScale) =>
          onChange({ ...sharedConfig, characterToken: { ...characterToken, balanceNameScale } })
        }
      />
      <PercentField
        label="Balanced effect size (%)"
        value={characterToken.balanceEffectScale}
        {...BALANCE_SCALE_BOUNDS}
        disabled={balanceDisabled}
        onChange={(balanceEffectScale) =>
          onChange({ ...sharedConfig, characterToken: { ...characterToken, balanceEffectScale } })
        }
      />
    </SectionPanel>
  );
};
