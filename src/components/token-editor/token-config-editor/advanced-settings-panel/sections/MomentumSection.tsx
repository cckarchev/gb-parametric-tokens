import { NumberField } from "@/components/primitives/number-field/NumberField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";

import { SectionPanel, type SectionProps } from "./section-panel/SectionPanel";
import { FontField } from "./shared/FontField";
import {
  INSET_BOUNDS,
  MOMENTUM_TEXT_SIZE_BOUNDS,
  RING_WIDTH_BOUNDS,
} from "./shared/fieldBounds";

export const MomentumSection = ({ sharedConfig, onChange }: SectionProps) => {
  const { momentum } = sharedConfig;

  const reset = () => {
    onChange({ ...sharedConfig, momentum: DEFAULT_SHARED_CONFIG.momentum });
  };

  return (
    <SectionPanel
      title="Momentum"
      onReset={reset}
      note="Uses the disc tokens' diameter."
    >
      <FontField
        fontId={momentum.fontId}
        onChange={(fontId) =>
          onChange({ ...sharedConfig, momentum: { ...momentum, fontId } })
        }
      />
      <NumberField
        label="Text size (mm)"
        value={momentum.textSizeMm}
        {...MOMENTUM_TEXT_SIZE_BOUNDS}
        onChange={(textSizeMm) =>
          onChange({ ...sharedConfig, momentum: { ...momentum, textSizeMm } })
        }
      />
      <NumberField
        label="Ring inset from rim (mm)"
        value={momentum.ringInsetMm}
        {...INSET_BOUNDS}
        onChange={(ringInsetMm) =>
          onChange({ ...sharedConfig, momentum: { ...momentum, ringInsetMm } })
        }
      />
      <NumberField
        label="Ring width (mm)"
        value={momentum.ringWidthMm}
        {...RING_WIDTH_BOUNDS}
        onChange={(ringWidthMm) =>
          onChange({ ...sharedConfig, momentum: { ...momentum, ringWidthMm } })
        }
      />
    </SectionPanel>
  );
};
