import { NumberField } from "@/components/primitives/number-field/NumberField";
import { PercentField } from "@/components/primitives/PercentField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";
import type { SharedConfig } from "@/core/token/catalog/token-items/tokenItem";

import { SectionPanel, type SectionProps } from "./section-panel/SectionPanel";
import { FontField } from "./shared/FontField";
import {
  BALANCE_SCALE_BOUNDS,
  CREST_SCALE_BOUNDS,
  TEXT_SIZE_BOUNDS,
} from "./shared/fieldBounds";
import { ShapeEditor } from "./shared/ShapeEditor";

type CharacterTokenConfig = SharedConfig["characterToken"];

export const ArcTokensSection = ({ sharedConfig, onChange }: SectionProps) => {
  const { characterToken } = sharedConfig;
  const balanceDisabled = !sharedConfig.balanceTwoLineSizes;

  const updateConfig = (patch: Partial<SharedConfig>) => {
    onChange({ ...sharedConfig, ...patch });
  };

  const updateCharacterToken = (patch: Partial<CharacterTokenConfig>) => {
    updateConfig({ characterToken: { ...characterToken, ...patch } });
  };

  const reset = () => {
    updateConfig({
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
        onChange={(arcShape) => updateConfig({ arcShape })}
      />

      <FontField
        fontId={characterToken.fontId}
        onChange={(fontId) => updateCharacterToken({ fontId })}
      />
      <NumberField
        label="Two-line name size (mm)"
        value={sharedConfig.nameSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(nameSizeMm) => updateConfig({ nameSizeMm })}
      />
      <NumberField
        label="Single-line name size (mm)"
        value={characterToken.singleLineNameSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(singleLineNameSizeMm) =>
          updateCharacterToken({ singleLineNameSizeMm })
        }
      />
      <NumberField
        label="Effect size (mm)"
        value={sharedConfig.effectSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(effectSizeMm) => updateConfig({ effectSizeMm })}
      />
      <PercentField
        label="Crest size (%)"
        value={characterToken.crestScale}
        {...CREST_SCALE_BOUNDS}
        onChange={(crestScale) => updateCharacterToken({ crestScale })}
      />
      <PercentField
        label="Balanced name size (%)"
        value={characterToken.balanceNameScale}
        {...BALANCE_SCALE_BOUNDS}
        disabled={balanceDisabled}
        onChange={(balanceNameScale) =>
          updateCharacterToken({ balanceNameScale })
        }
      />
      <PercentField
        label="Balanced effect size (%)"
        value={characterToken.balanceEffectScale}
        {...BALANCE_SCALE_BOUNDS}
        disabled={balanceDisabled}
        onChange={(balanceEffectScale) =>
          updateCharacterToken({ balanceEffectScale })
        }
      />
    </SectionPanel>
  );
};
