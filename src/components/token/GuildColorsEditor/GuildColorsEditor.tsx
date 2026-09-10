import { TEXT_COLOR_GROUP_ID } from "../../../core/token/catalog/deriveReliefColor";
import { BASE_COLOR_GROUP_ID } from "../../../core/token/mesh/colorGroups";
import { ColorGroupSpec } from "../../../core/token/types";
import { ColorField } from "../../primitives/ColorField/ColorField";
import styles from "./GuildColorsEditor.module.css";

type GuildColorsEditorProps = {
  colorGroups: ColorGroupSpec[];
  onChange: (colorGroups: ColorGroupSpec[]) => void;
};

// The token flow always seeds exactly two colors from the selected guild (useTokenGenerator.ts):
// the body (base color group) and the text/symbols (derived relief color). Unlike
// ColorGroupsEditor, there is no add/remove here, matching the product rule that these two
// roles are fixed.
export const GuildColorsEditor = ({ colorGroups, onChange }: GuildColorsEditorProps) => {
  const updateColor = (id: string, color: string) => {
    onChange(colorGroups.map((group) => (group.id === id ? { ...group, color } : group)));
  };

  const bodyColor = colorGroups.find((group) => group.id === BASE_COLOR_GROUP_ID)?.color ?? "";
  const textColor = colorGroups.find((group) => group.id === TEXT_COLOR_GROUP_ID)?.color ?? "";

  return (
    <div className={styles.row}>
      <ColorField
        label="Body"
        value={bodyColor}
        onChange={(color) => updateColor(BASE_COLOR_GROUP_ID, color)}
      />
      <ColorField
        label="Details"
        value={textColor}
        onChange={(color) => updateColor(TEXT_COLOR_GROUP_ID, color)}
      />
    </div>
  );
};
