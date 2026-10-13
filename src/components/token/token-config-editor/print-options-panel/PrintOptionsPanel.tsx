import { ICON_OVERFLOW_BEHAVIOR_OPTIONS } from "@/components/editor/iconOverflowBehaviorOptions";
import { PrintProfileSelector } from "@/components/editor/print-profile-selector/PrintProfileSelector";
import { RELIEF_OPTIONS } from "@/components/editor/reliefOptions";
import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { Panel } from "@/components/primitives/panel/Panel";
import { SelectField } from "@/components/primitives/select-field/SelectField";
import { SharedConfig } from "@/core/token/catalog/tokenItems/tokenItem";

import { GuildColorsEditor } from "../../guild-colors-editor/GuildColorsEditor";
import styles from "./PrintOptionsPanel.module.css";

type PrintOptionsPanelProps = {
  sharedConfig: SharedConfig;
  onChange: (sharedConfig: SharedConfig) => void;
};

export const PrintOptionsPanel = ({ sharedConfig, onChange }: PrintOptionsPanelProps) => {
  return (
    <Panel title="Print options" defaultExpanded={true}>
      <div className={styles.optionsGrid}>
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

        <CheckboxField
          label="Show second line"
          checked={sharedConfig.showSecondLine}
          onChange={(showSecondLine) => onChange({ ...sharedConfig, showSecondLine })}
        />

        <CheckboxField
          label="Balance line sizes"
          checked={sharedConfig.balanceTwoLineSizes}
          disabled={!sharedConfig.showSecondLine}
          onChange={(balanceTwoLineSizes) => onChange({ ...sharedConfig, balanceTwoLineSizes })}
        />

        <SelectField
          label="Icons that overflow their circle"
          value={sharedConfig.iconOverflowBehavior}
          options={ICON_OVERFLOW_BEHAVIOR_OPTIONS}
          onChange={(iconOverflowBehavior) => onChange({ ...sharedConfig, iconOverflowBehavior })}
        />

        <GuildColorsEditor
          colorGroups={sharedConfig.colorGroups}
          onChange={(colorGroups) => onChange({ ...sharedConfig, colorGroups })}
        />
      </div>
    </Panel>
  );
};
