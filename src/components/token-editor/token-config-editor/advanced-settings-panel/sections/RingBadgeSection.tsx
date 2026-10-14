import { NumberField } from "@/components/primitives/number-field/NumberField";
import { PercentField } from "@/components/primitives/PercentField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";

import { SectionPanel, SectionProps } from "./section-panel/SectionPanel";
import { CREST_SCALE_BOUNDS, INSET_BOUNDS, TEXT_SIZE_BOUNDS } from "./shared/fieldBounds";
import { ShapeEditor } from "./shared/ShapeEditor";

export const RingBadgeSection = ({ sharedConfig, onChange }: SectionProps) => {
  const { ringBadge } = sharedConfig;

  const reset = () => {
    onChange({
      ...sharedConfig,
      goalInfluenceShape: DEFAULT_SHARED_CONFIG.goalInfluenceShape,
      ringBadge: DEFAULT_SHARED_CONFIG.ringBadge,
    });
  };

  return (
    <SectionPanel title="Goal Influence and ring badges" onReset={reset}>
      <ShapeEditor
        shape={sharedConfig.goalInfluenceShape}
        onChange={(goalInfluenceShape) => onChange({ ...sharedConfig, goalInfluenceShape })}
      />
      <NumberField
        label="Text size (mm)"
        value={ringBadge.textSizeMm}
        {...TEXT_SIZE_BOUNDS}
        onChange={(textSizeMm) =>
          onChange({ ...sharedConfig, ringBadge: { ...ringBadge, textSizeMm } })
        }
      />
      <NumberField
        label="Text inset from rim (mm)"
        value={ringBadge.textInsetMm}
        {...INSET_BOUNDS}
        onChange={(textInsetMm) =>
          onChange({ ...sharedConfig, ringBadge: { ...ringBadge, textInsetMm } })
        }
      />
      <PercentField
        label="Crest size (%)"
        value={ringBadge.crestScale}
        {...CREST_SCALE_BOUNDS}
        onChange={(crestScale) =>
          onChange({ ...sharedConfig, ringBadge: { ...ringBadge, crestScale } })
        }
      />
    </SectionPanel>
  );
};
