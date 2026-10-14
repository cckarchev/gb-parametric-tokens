import { Panel } from "@/components/primitives/panel/Panel";
import { SharedConfig } from "@/core/token/catalog/token-items/tokenItem";

import { ArcTokensSection } from "./sections/ArcTokensSection";
import { AoeTemplatesSection } from "./sections/aoe-templates-section/AoeTemplatesSection";
import { ConditionsSection } from "./sections/ConditionsSection";
import { DiscTokensSection } from "./sections/DiscTokensSection";
import { GeneralSection } from "./sections/general-section/GeneralSection";
import { MomentumSection } from "./sections/MomentumSection";
import { RingBadgeSection } from "./sections/RingBadgeSection";

type AdvancedSettingsPanelProps = {
  sharedConfig: SharedConfig;
  onChange: (sharedConfig: SharedConfig) => void;
  onExportSettings: () => void;
  onImportSettings: (file: File) => void;
  importSettingsError: string | undefined;
};

// One collapsible section per token kind, each owning its own fields and its own reset, in the
// order the preview shows those tokens: arc tokens, then the roster's AOE templates, then the
// guild tokens (Influence, Momentum, Goal Influence) and the conditions.
export const AdvancedSettingsPanel = ({
  sharedConfig,
  onChange,
  onExportSettings,
  onImportSettings,
  importSettingsError,
}: AdvancedSettingsPanelProps) => {
  return (
    <Panel title="Advanced settings">
      <GeneralSection
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={onExportSettings}
        onImportSettings={onImportSettings}
        importSettingsError={importSettingsError}
      />
      <ArcTokensSection sharedConfig={sharedConfig} onChange={onChange} />
      <AoeTemplatesSection sharedConfig={sharedConfig} onChange={onChange} />
      <DiscTokensSection sharedConfig={sharedConfig} onChange={onChange} />
      <MomentumSection sharedConfig={sharedConfig} onChange={onChange} />
      <RingBadgeSection sharedConfig={sharedConfig} onChange={onChange} />
      <ConditionsSection sharedConfig={sharedConfig} onChange={onChange} />
    </Panel>
  );
};
