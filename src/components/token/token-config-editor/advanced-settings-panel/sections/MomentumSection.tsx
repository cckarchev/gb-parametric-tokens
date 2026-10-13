import {
  INSET_BOUNDS,
  MOMENTUM_TEXT_SIZE_BOUNDS,
  RING_WIDTH_BOUNDS,
} from "@/components/editor/fieldBounds";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/tokenItems/defaultSharedConfig";

import { SectionPanel, SectionProps } from "./section-panel/SectionPanel";

export const MomentumSection = ({ sharedConfig, onChange }: SectionProps) => {
  const { momentum } = sharedConfig;

  const reset = () => {
    onChange({ ...sharedConfig, momentum: DEFAULT_SHARED_CONFIG.momentum });
  };

  return (
    <SectionPanel title="Momentum" onReset={reset} note="Uses the disc tokens' diameter.">
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
