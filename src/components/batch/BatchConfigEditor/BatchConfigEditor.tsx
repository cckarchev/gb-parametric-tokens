import { BatchSharedConfig } from "../../../core/token/catalog/buildBatchItems";
import { ReliefStyle } from "../../../core/token/types";
import { FitPolicyEditor } from "../../editor/FitPolicyEditor/FitPolicyEditor";
import { PrintProfileSelector } from "../../editor/PrintProfileSelector/PrintProfileSelector";
import { ShapeEditor } from "../../editor/ShapeEditor/ShapeEditor";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";
import { SelectField, SelectFieldOption } from "../../primitives/SelectField/SelectField";
import { GuildColorsEditor } from "../GuildColorsEditor/GuildColorsEditor";
import styles from "./BatchConfigEditor.module.css";

export type BatchConfigEditorProps = {
  sharedConfig: BatchSharedConfig;
  onChange: (sharedConfig: BatchSharedConfig) => void;
};

const RELIEF_OPTIONS: SelectFieldOption<ReliefStyle>[] = [
  { value: "raised", label: "Raised" },
  { value: "engraved", label: "Engraved" },
];

export const BatchConfigEditor = ({ sharedConfig, onChange }: BatchConfigEditorProps) => {
  return (
    <div className={styles.wrapper}>
      <PrintProfileSelector
        printProfileId={sharedConfig.printProfileId}
        onChange={(printProfileId) => onChange({ ...sharedConfig, printProfileId })}
      />

      <SelectField
        label="Relief"
        value={sharedConfig.style.relief}
        options={RELIEF_OPTIONS}
        onChange={(relief) =>
          onChange({ ...sharedConfig, style: { ...sharedConfig.style, relief } })
        }
      />

      <GuildColorsEditor
        colorGroups={sharedConfig.colorGroups}
        onChange={(colorGroups) => onChange({ ...sharedConfig, colorGroups })}
      />

      <Panel title="Advanced settings" defaultExpanded={false}>
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Arc tokens (character effects)</h3>
          <ShapeEditor
            shape={sharedConfig.arcShape}
            onChange={(shape) => {
              if (shape.type === "arc") {
                onChange({ ...sharedConfig, arcShape: shape });
              }
            }}
          />
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Disc tokens (generics, Influence, Momentum)</h3>
          <ShapeEditor
            shape={sharedConfig.discShape}
            onChange={(shape) => {
              if (shape.type === "disc") {
                onChange({ ...sharedConfig, discShape: shape });
              }
            }}
          />
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Goal Influence tokens</h3>
          <ShapeEditor
            shape={sharedConfig.goalInfluenceShape}
            onChange={(shape) => {
              if (shape.type === "disc") {
                onChange({ ...sharedConfig, goalInfluenceShape: shape });
              }
            }}
          />
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Style</h3>
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
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Font</h3>
          <NumberField
            label="Title size (mm)"
            value={sharedConfig.titleSizeMm}
            onChange={(titleSizeMm) => onChange({ ...sharedConfig, titleSizeMm })}
          />
          <NumberField
            label="Subtitle size (mm)"
            value={sharedConfig.subtitleSizeMm}
            onChange={(subtitleSizeMm) => onChange({ ...sharedConfig, subtitleSizeMm })}
          />
        </div>

        <FitPolicyEditor
          fitPolicy={sharedConfig.fitPolicy}
          onChange={(fitPolicy) => onChange({ ...sharedConfig, fitPolicy })}
        />
      </Panel>
    </div>
  );
};
