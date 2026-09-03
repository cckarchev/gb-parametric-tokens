import { ColorGroupSpec, LineSpec } from "../core/token/types";
import styles from "./LinesEditor.module.css";
import { Button } from "./primitives/Button";
import { NumberField } from "./primitives/NumberField";
import { Panel } from "./primitives/Panel";
import { SelectField } from "./primitives/SelectField";
import { TextField } from "./primitives/TextField";

export type LinesEditorProps = {
  lines: LineSpec[];
  colorGroups: ColorGroupSpec[];
  onChange: (lines: LineSpec[]) => void;
};

const NO_COLOR_GROUP_VALUE = "";
const DEFAULT_LINE: LineSpec = { text: "", sizeMm: 6 };
const MAX_LINES = 2;

export const LinesEditor = ({ lines, colorGroups, onChange }: LinesEditorProps) => {
  const colorGroupOptions = [
    { value: NO_COLOR_GROUP_VALUE, label: "(base)" },
    ...colorGroups.map((group) => ({ value: group.id, label: group.name })),
  ];

  const updateLine = (index: number, updates: Partial<LineSpec>) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...updates } : line)));
  };

  const removeLine = (index: number) => {
    onChange(lines.filter((_, i) => i !== index));
  };

  const addLine = () => {
    onChange([...lines, DEFAULT_LINE]);
  };

  return (
    <Panel title="Lines">
      {lines.map((line, index) => (
        <div className={styles.item} key={index}>
          <TextField
            label="Text"
            value={line.text}
            onChange={(text) => updateLine(index, { text })}
          />
          <NumberField
            label="Size (mm)"
            value={line.sizeMm}
            onChange={(sizeMm) => updateLine(index, { sizeMm })}
          />
          <SelectField
            label="Color group"
            value={line.colorGroup ?? NO_COLOR_GROUP_VALUE}
            options={colorGroupOptions}
            onChange={(value) =>
              updateLine(index, { colorGroup: value === NO_COLOR_GROUP_VALUE ? undefined : value })
            }
          />
          <Button label="Remove line" onClick={() => removeLine(index)} />
        </div>
      ))}
      {/* Position on the arc is derived from the line count (computeReliefComponents falls back
          to a computed midRadiusMm per line), not something the user sets, so lines beyond the
          two the arc actually fits are never offered. */}
      {lines.length < MAX_LINES && <Button label="Add line" onClick={addLine} />}
    </Panel>
  );
};
