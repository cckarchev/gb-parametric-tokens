import { PercentField } from "@/components/primitives/PercentField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/tokenItems/defaultSharedConfig";

import { SectionPanel, SectionProps } from "./section-panel/SectionPanel";
import { CREST_SCALE_BOUNDS } from "./shared/fieldBounds";

export const ConditionsSection = ({ sharedConfig, onChange }: SectionProps) => {
  const reset = () => {
    onChange({ ...sharedConfig, condition: DEFAULT_SHARED_CONFIG.condition });
  };

  return (
    <SectionPanel title="Conditions" onReset={reset} note="Uses the Goal Influence diameter.">
      <PercentField
        label="Icon size (%)"
        value={sharedConfig.condition.iconScale}
        {...CREST_SCALE_BOUNDS}
        onChange={(iconScale) => onChange({ ...sharedConfig, condition: { iconScale } })}
      />
    </SectionPanel>
  );
};
