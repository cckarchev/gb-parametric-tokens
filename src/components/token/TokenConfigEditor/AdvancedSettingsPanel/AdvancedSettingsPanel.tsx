import { SharedConfig } from "../../../../core/token/catalog/tokenItems/tokenItem";
import { ShapeSpec } from "../../../../core/token/types";
import { FitPolicyEditor } from "../../../editor/FitPolicyEditor/FitPolicyEditor";
import { ShapeEditor } from "../../../editor/ShapeEditor/ShapeEditor";
import { NumberField } from "../../../primitives/NumberField/NumberField";
import { Panel } from "../../../primitives/Panel/Panel";
import { SettingsGroup } from "../../../primitives/SettingsGroup/SettingsGroup";
import { SettingsFileGroup } from "../SettingsFileGroup/SettingsFileGroup";

type ShapeSlotProps<T extends ShapeSpec> = {
  title: string;
  shape: T;
  onChange: (shape: T) => void;
};

// One shape slot of the shared config: a titled group around the editor for whichever shape that
// slot holds. Its type is fixed by the slot itself, so the editor gives back the same arm it was
// given and nothing here has to narrow.
const ShapeSlot = <T extends ShapeSpec>({ title, shape, onChange }: ShapeSlotProps<T>) => {
  return (
    <SettingsGroup title={title}>
      <ShapeEditor shape={shape} onChange={onChange} />
    </SettingsGroup>
  );
};

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
    <Panel title="Advanced settings">
      <SettingsFileGroup
        onExportSettings={onExportSettings}
        onImportSettings={onImportSettings}
        importSettingsError={importSettingsError}
      />

      <ShapeSlot
        title="Arc tokens (character effects)"
        shape={sharedConfig.arcShape}
        onChange={(arcShape) => onChange({ ...sharedConfig, arcShape })}
      />

      <ShapeSlot
        title="Disc tokens (generics, Influence, Momentum)"
        shape={sharedConfig.discShape}
        onChange={(discShape) => onChange({ ...sharedConfig, discShape })}
      />

      <ShapeSlot
        title="Goal Influence tokens"
        shape={sharedConfig.goalInfluenceShape}
        onChange={(goalInfluenceShape) => onChange({ ...sharedConfig, goalInfluenceShape })}
      />

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
