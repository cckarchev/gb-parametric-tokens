import { ColorField } from "@/components/primitives/color-field/ColorField";
import { BASE_COLOR_GROUP_ID, TEXT_COLOR_GROUP_ID } from "@/core/token/mesh/colorGroups";
import { ColorGroupSpec } from "@/core/token/types";

import styles from "./GuildColorsEditor.module.css";

type GuildColorsEditorProps = {
  colorGroups: ColorGroupSpec[];
  onChange: (colorGroups: ColorGroupSpec[]) => void;
};

// Always the guild's two colors, body and text, so nothing to add or remove.
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
