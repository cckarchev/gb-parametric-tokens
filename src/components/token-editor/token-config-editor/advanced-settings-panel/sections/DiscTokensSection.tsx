import { PercentField } from "@/components/primitives/PercentField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";

import { SectionPanel, SectionProps } from "./section-panel/SectionPanel";
import { CREST_SCALE_BOUNDS } from "./shared/fieldBounds";
import { ShapeEditor } from "./shared/ShapeEditor";

export const DiscTokensSection = ({ sharedConfig, onChange }: SectionProps) => {
  const reset = () => {
    onChange({
      ...sharedConfig,
      discShape: DEFAULT_SHARED_CONFIG.discShape,
      discToken: DEFAULT_SHARED_CONFIG.discToken,
    });
  };

  return (
    <SectionPanel
      title="Disc tokens"
      onReset={reset}
      note="Generics, Influence and Momentum. Momentum has no crest.">
      <ShapeEditor
        shape={sharedConfig.discShape}
        onChange={(discShape) => onChange({ ...sharedConfig, discShape })}
      />
      <PercentField
        label="Crest size (%)"
        value={sharedConfig.discToken.crestScale}
        {...CREST_SCALE_BOUNDS}
        onChange={(crestScale) => onChange({ ...sharedConfig, discToken: { crestScale } })}
      />
    </SectionPanel>
  );
};
