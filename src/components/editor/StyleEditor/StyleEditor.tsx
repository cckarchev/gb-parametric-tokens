import { StyleSpec } from "../../../core/token/types";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";
import { SelectField } from "../../primitives/SelectField/SelectField";
import { RELIEF_OPTIONS } from "../reliefOptions";

export type StyleEditorProps = {
  style: StyleSpec;
  onChange: (style: StyleSpec) => void;
};

export const StyleEditor = ({ style, onChange }: StyleEditorProps) => {
  return (
    <Panel title="Style">
      <SelectField
        label="Relief"
        value={style.relief}
        options={RELIEF_OPTIONS}
        onChange={(relief) => onChange({ ...style, relief })}
      />
      <NumberField
        label="Relief height (mm)"
        value={style.reliefHeightMm}
        onChange={(reliefHeightMm) => onChange({ ...style, reliefHeightMm })}
      />
      <NumberField
        label="Base thickness (mm)"
        value={style.baseThicknessMm}
        onChange={(baseThicknessMm) => onChange({ ...style, baseThicknessMm })}
      />
    </Panel>
  );
};
