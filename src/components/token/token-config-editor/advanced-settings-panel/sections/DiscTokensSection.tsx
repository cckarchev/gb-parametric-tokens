import { CREST_SCALE_BOUNDS } from "@/components/editor/fieldBounds";
import { ShapeEditor } from "@/components/editor/shape-editor/ShapeEditor";
import { PercentField } from "@/components/primitives/percent-field/PercentField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/tokenItems/defaultSharedConfig";

import { SectionPanel, SectionProps } from "./section-panel/SectionPanel";

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
