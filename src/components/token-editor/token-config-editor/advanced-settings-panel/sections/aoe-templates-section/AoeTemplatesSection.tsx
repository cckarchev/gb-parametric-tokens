import { SelectField } from "@/components/primitives/select-field/SelectField";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";
import { AoeTuning } from "@/core/token/catalog/token-items/tokenItem";

import { SectionPanel, SectionProps } from "../section-panel/SectionPanel";
import { CompactDiscFields } from "./CompactDiscFields";
import { CrowfootFields } from "./CrowfootFields";
import { RingFields } from "./RingFields";
import { AOE_TEMPLATE_VARIANT_OPTIONS } from "./variantOptions";

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
