import { PlateLayout } from "../core/token/geometry/computePlateOffsets";
import { NumberField } from "./primitives/NumberField";
import { Panel } from "./primitives/Panel";

export type PlateEditorProps = {
  plateLayout: PlateLayout;
  onChange: (plateLayout: PlateLayout) => void;
};

export const PlateEditor = ({ plateLayout, onChange }: PlateEditorProps) => {
  return (
    <Panel title="Plate">
      <NumberField
        label="Copies"
        value={plateLayout.count}
        min={1}
        onChange={(count) => onChange({ ...plateLayout, count })}
      />
      <NumberField
        label="Columns"
        value={plateLayout.columns}
        min={1}
        onChange={(columns) => onChange({ ...plateLayout, columns })}
      />
      <NumberField
        label="Spacing (mm)"
        value={plateLayout.spacingMm}
        min={0}
        onChange={(spacingMm) => onChange({ ...plateLayout, spacingMm })}
      />
    </Panel>
  );
};
