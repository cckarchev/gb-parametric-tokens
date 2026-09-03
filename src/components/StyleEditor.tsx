import { ReliefStyle, StyleSpec } from "../core/token/types";
import { NumberField } from "./primitives/NumberField";
import { Panel } from "./primitives/Panel";
import { SelectField, SelectFieldOption } from "./primitives/SelectField";

export type StyleEditorProps = {
  style: StyleSpec;
  onChange: (style: StyleSpec) => void;
};

const RELIEF_OPTIONS: SelectFieldOption<ReliefStyle>[] = [
  { value: "raised", label: "Raised" },
  { value: "engraved", label: "Engraved" },
];

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
