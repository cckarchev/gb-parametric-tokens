import { ManifestEntry } from "../../../core/token/icons/iconManifest";
import { ColorGroupSpec, IconSpec, ShapeSpec } from "../../../core/token/types";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";
import { SelectField } from "../../primitives/SelectField/SelectField";
import { IconPicker } from "../IconPicker/IconPicker";

export type IconsEditorProps = {
  shapeType: ShapeSpec["type"];
  icons: IconSpec[];
  colorGroups: ColorGroupSpec[];
  manifest: ManifestEntry[];
  onChange: (icons: IconSpec[]) => void;
};

const NO_COLOR_GROUP_VALUE = "";
const DEFAULT_SCALE = 0.7;

type IconSlotSide = IconSpec["side"];

const SLOT_LABELS: Record<IconSlotSide, string> = {
  center: "Center icon",
  left: "Left nob icon",
  right: "Right nob icon",
};

export const IconsEditor = ({
  shapeType,
  icons,
  colorGroups,
  manifest,
  onChange,
}: IconsEditorProps) => {
  const sides: IconSlotSide[] = shapeType === "disc" ? ["center"] : ["left", "right"];
  const colorGroupOptions = [
    { value: NO_COLOR_GROUP_VALUE, label: "(base)" },
    ...colorGroups.map((group) => ({ value: group.id, label: group.name })),
  ];

  const updateSlot = (side: IconSlotSide, updates: Partial<IconSpec> | undefined) => {
    const withoutSide = icons.filter((icon) => icon.side !== side);

    if (!updates) {
      onChange(withoutSide);
      return;
    }

    const existing = icons.find((icon) => icon.side === side);
    const merged: IconSpec = { iconId: "", side, scale: DEFAULT_SCALE, ...existing, ...updates };

    onChange([...withoutSide, merged]);
  };

  return (
    <Panel title="Icons">
      {sides.map((side) => {
        const icon = icons.find((candidate) => candidate.side === side);

        return (
          <div key={side}>
            <span>{SLOT_LABELS[side]}</span>
            <IconPicker
              manifest={manifest}
              value={icon?.iconId}
              onChange={(iconId) => updateSlot(side, iconId ? { iconId } : undefined)}
            />
            {icon && (
              <>
                <NumberField
                  label="Scale"
                  value={icon.scale}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={(scale) => updateSlot(side, { scale })}
                />
                <SelectField
                  label="Color group"
                  value={icon.colorGroup ?? NO_COLOR_GROUP_VALUE}
                  options={colorGroupOptions}
                  onChange={(value) =>
                    updateSlot(side, {
                      colorGroup: value === NO_COLOR_GROUP_VALUE ? undefined : value,
                    })
                  }
                />
              </>
            )}
          </div>
        );
      })}
    </Panel>
  );
};
