import { SharedConfig } from "../../../../core/token/catalog/tokenItems/tokenItem";
import { Panel } from "../../../primitives/Panel/Panel";
import { AoeTemplatesSection } from "./sections/AoeTemplatesSection";
import { ArcTokensSection } from "./sections/ArcTokensSection";
import { ConditionsSection } from "./sections/ConditionsSection";
import { DiscTokensSection } from "./sections/DiscTokensSection";
import { GeneralSection } from "./sections/GeneralSection";
import { MomentumSection } from "./sections/MomentumSection";
import { RingBadgeSection } from "./sections/RingBadgeSection";

type AdvancedSettingsPanelProps = {
  sharedConfig: SharedConfig;
  onChange: (sharedConfig: SharedConfig) => void;
  onExportSettings: () => void;
  onImportSettings: (file: File) => void;
  importSettingsError: string | undefined;
};

// One collapsible section per token kind, each owning its own fields and its own reset.
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
      <DiscTokensSection sharedConfig={sharedConfig} onChange={onChange} />
      <RingBadgeSection sharedConfig={sharedConfig} onChange={onChange} />
      <MomentumSection sharedConfig={sharedConfig} onChange={onChange} />
      <ConditionsSection sharedConfig={sharedConfig} onChange={onChange} />
      <AoeTemplatesSection sharedConfig={sharedConfig} onChange={onChange} />
    </Panel>
  );
};
