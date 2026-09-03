import { TEXT_COLOR_GROUP_ID } from "../../../core/token/catalog/deriveReliefColor";
import { BASE_COLOR_GROUP_ID } from "../../../core/token/mesh/colorGroups";
import { ColorGroupSpec } from "../../../core/token/types";
import { ColorField } from "../../primitives/ColorField/ColorField";

export type GuildColorsEditorProps = {
  colorGroups: ColorGroupSpec[];
  onChange: (colorGroups: ColorGroupSpec[]) => void;
};

// The batch flow always seeds exactly two colors from the selected guild (useBatch.ts): the
// body (base color group) and the text/symbols (derived relief color). Unlike ColorGroupsEditor,
// there is no add/remove here, matching the product rule that these two roles are fixed.
export const GuildColorsEditor = ({ colorGroups, onChange }: GuildColorsEditorProps) => {
  const updateColor = (id: string, color: string) => {
    onChange(colorGroups.map((group) => (group.id === id ? { ...group, color } : group)));
  };

  const bodyColor = colorGroups.find((group) => group.id === BASE_COLOR_GROUP_ID)?.color ?? "";
  const textColor = colorGroups.find((group) => group.id === TEXT_COLOR_GROUP_ID)?.color ?? "";

  return (
    <>
      <ColorField
        label="Body"
        value={bodyColor}
        onChange={(color) => updateColor(BASE_COLOR_GROUP_ID, color)}
      />
      <ColorField
        label="Text & symbols"
        value={textColor}
        onChange={(color) => updateColor(TEXT_COLOR_GROUP_ID, color)}
      />
    </>
  );
};
