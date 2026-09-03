import { ColorGroupSpec } from "../../../core/token/types";
import { Button } from "../../primitives/Button/Button";
import { ColorField } from "../../primitives/ColorField/ColorField";
import { Panel } from "../../primitives/Panel/Panel";
import { TextField } from "../../primitives/TextField/TextField";
import styles from "./ColorGroupsEditor.module.css";

export type ColorGroupsEditorProps = {
  colorGroups: ColorGroupSpec[];
  onChange: (colorGroups: ColorGroupSpec[]) => void;
};

const DEFAULT_COLOR_GROUP: ColorGroupSpec = { id: "", name: "", color: "#CCCCCC" };

export const ColorGroupsEditor = ({ colorGroups, onChange }: ColorGroupsEditorProps) => {
  const updateGroup = (index: number, updates: Partial<ColorGroupSpec>) => {
    onChange(colorGroups.map((group, i) => (i === index ? { ...group, ...updates } : group)));
  };

  const removeGroup = (index: number) => {
    onChange(colorGroups.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    onChange([...colorGroups, DEFAULT_COLOR_GROUP]);
  };

  return (
    <Panel title="Color groups">
      {colorGroups.map((group, index) => (
        <div className={styles.item} key={index}>
          <TextField label="Id" value={group.id} onChange={(id) => updateGroup(index, { id })} />
          <TextField
            label="Name"
            value={group.name}
            onChange={(name) => updateGroup(index, { name })}
          />
          <ColorField
            label="Color"
            value={group.color}
            onChange={(color) => updateGroup(index, { color })}
          />
          <Button label="Remove color group" onClick={() => removeGroup(index)} />
        </div>
      ))}
      <Button label="Add color group" onClick={addGroup} />
    </Panel>
  );
};
