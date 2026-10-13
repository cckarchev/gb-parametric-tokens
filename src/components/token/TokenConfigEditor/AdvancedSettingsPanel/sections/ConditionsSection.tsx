import { DEFAULT_SHARED_CONFIG } from "../../../../../core/token/catalog/tokenItems/defaultSharedConfig";
import { CREST_SCALE_BOUNDS } from "../../../../editor/fieldBounds";
import { PercentField } from "../../../../primitives/PercentField/PercentField";
import { SectionPanel, SectionProps } from "./SectionPanel/SectionPanel";

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
