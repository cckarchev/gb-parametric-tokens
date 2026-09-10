import { SharedConfig } from "../../../../core/token/catalog/tokenItems/tokenItem";
import { ArcShapeSpec, DiscShapeSpec, ShapeSpec } from "../../../../core/token/types";
import { FitPolicyEditor } from "../../../editor/FitPolicyEditor/FitPolicyEditor";
import { ShapeEditor } from "../../../editor/ShapeEditor/ShapeEditor";
import { NumberField } from "../../../primitives/NumberField/NumberField";
import { Panel } from "../../../primitives/Panel/Panel";
import { SettingsGroup } from "../../../primitives/SettingsGroup/SettingsGroup";
import { SettingsFileGroup } from "../SettingsFileGroup/SettingsFileGroup";

// One shape slot of the shared config, locked to a single shape type.
type ShapeSlotProps =
  | {
      title: string;
      shapeType: "arc";
      shape: ArcShapeSpec;
      onChange: (shape: ArcShapeSpec) => void;
    }
  | {
      title: string;
      shapeType: "disc";
      shape: DiscShapeSpec;
      onChange: (shape: DiscShapeSpec) => void;
    };

// A slot's type never changes, so the type switch ShapeEditor offers is ignored here: an arc
// token's shape can never become a disc, or vice versa.
const ShapeSlot = (props: ShapeSlotProps) => {
  const handleChange = (shape: ShapeSpec) => {
    if (props.shapeType === "arc" && shape.type === "arc") {
      props.onChange(shape);
      return;
    }

    if (props.shapeType === "disc" && shape.type === "disc") {
      props.onChange(shape);
    }
  };

  return (
    <SettingsGroup title={props.title}>
      <ShapeEditor shape={props.shape} onChange={handleChange} />
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
    <Panel title="Advanced settings" defaultExpanded={false}>
      <SettingsFileGroup
        onExportSettings={onExportSettings}
        onImportSettings={onImportSettings}
        importSettingsError={importSettingsError}
      />

      <ShapeSlot
        title="Arc tokens (character effects)"
        shapeType="arc"
        shape={sharedConfig.arcShape}
        onChange={(arcShape) => onChange({ ...sharedConfig, arcShape })}
      />

      <ShapeSlot
        title="Disc tokens (generics, Influence, Momentum)"
        shapeType="disc"
        shape={sharedConfig.discShape}
        onChange={(discShape) => onChange({ ...sharedConfig, discShape })}
      />

      <ShapeSlot
        title="Goal Influence tokens"
        shapeType="disc"
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
