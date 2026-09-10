import { SharedConfig } from "../../../../core/token/catalog/tokenItems/tokenItem";
import { FitPolicyEditor } from "../../../editor/FitPolicyEditor/FitPolicyEditor";
import { ShapeEditor } from "../../../editor/ShapeEditor/ShapeEditor";
import { NumberField } from "../../../primitives/NumberField/NumberField";
import { Panel } from "../../../primitives/Panel/Panel";
import { SettingsGroup } from "../../../primitives/SettingsGroup/SettingsGroup";
import { SettingsFileGroup } from "../SettingsFileGroup/SettingsFileGroup";

export type AdvancedSettingsPanelProps = {
  sharedConfig: SharedConfig;
  onChange: (sharedConfig: SharedConfig) => void;
  onExportSettings: () => void;
  onImportSettings: (file: File) => void;
  importSettingsError: string | undefined;
};

export const AdvancedSettingsPanel = ({
  sharedConfig,
  onChange,
  onExportSettings,
  onImportSettings,
  importSettingsError,
}: AdvancedSettingsPanelProps) => {
  return (
    <Panel title="Advanced settings" defaultExpanded={false}>
      <SettingsFileGroup
        onExportSettings={onExportSettings}
        onImportSettings={onImportSettings}
        importSettingsError={importSettingsError}
      />

      {/* Each slot below is locked to one shape type, so the type switch ShapeEditor offers is
          ignored here: an arc token's shape can never become a disc, or vice versa. */}
      <SettingsGroup title="Arc tokens (character effects)">
        <ShapeEditor
          shape={sharedConfig.arcShape}
          onChange={(shape) => {
            if (shape.type === "arc") {
              onChange({ ...sharedConfig, arcShape: shape });
            }
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="Disc tokens (generics, Influence, Momentum)">
        <ShapeEditor
          shape={sharedConfig.discShape}
          onChange={(shape) => {
            if (shape.type === "disc") {
              onChange({ ...sharedConfig, discShape: shape });
            }
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="Goal Influence tokens">
        <ShapeEditor
          shape={sharedConfig.goalInfluenceShape}
          onChange={(shape) => {
            if (shape.type === "disc") {
              onChange({ ...sharedConfig, goalInfluenceShape: shape });
            }
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="Style">
        <NumberField
          label="Relief height (mm)"
          value={sharedConfig.style.reliefHeightMm}
          onChange={(reliefHeightMm) =>
            onChange({ ...sharedConfig, style: { ...sharedConfig.style, reliefHeightMm } })
          }
        />
        <NumberField
          label="Base thickness (mm)"
          value={sharedConfig.style.baseThicknessMm}
          onChange={(baseThicknessMm) =>
            onChange({ ...sharedConfig, style: { ...sharedConfig.style, baseThicknessMm } })
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Font">
        <NumberField
          label="Name size (mm)"
          value={sharedConfig.nameSizeMm}
          onChange={(nameSizeMm) => onChange({ ...sharedConfig, nameSizeMm })}
        />
        <NumberField
          label="Effect size (mm)"
          value={sharedConfig.effectSizeMm}
          onChange={(effectSizeMm) => onChange({ ...sharedConfig, effectSizeMm })}
        />
      </SettingsGroup>

      <FitPolicyEditor
        fitPolicy={sharedConfig.fitPolicy}
        onChange={(fitPolicy) => onChange({ ...sharedConfig, fitPolicy })}
      />
    </Panel>
  );
};
