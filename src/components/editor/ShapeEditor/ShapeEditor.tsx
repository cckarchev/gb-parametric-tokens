import { DEFAULT_ARC_SHAPE, DEFAULT_DISC_SHAPE } from "../../../core/token/defaultShapeAndStyle";
import { ShapeSpec } from "../../../core/token/types";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";
import { SelectField, SelectFieldOption } from "../../primitives/SelectField/SelectField";

export type ShapeEditorProps = {
  shape: ShapeSpec;
  onChange: (shape: ShapeSpec) => void;
};

const SHAPE_TYPE_OPTIONS: SelectFieldOption<ShapeSpec["type"]>[] = [
  { value: "disc", label: "Disc" },
  { value: "arc", label: "Arc" },
];

export const ShapeEditor = ({ shape, onChange }: ShapeEditorProps) => {
  const handleTypeChange = (type: ShapeSpec["type"]) => {
    onChange(type === "disc" ? DEFAULT_DISC_SHAPE : DEFAULT_ARC_SHAPE);
  };

  return (
    <Panel title="Shape">
      <SelectField
        label="Shape type"
        value={shape.type}
        options={SHAPE_TYPE_OPTIONS}
        onChange={handleTypeChange}
      />

      {shape.type === "disc" && (
        <NumberField
          label="Diameter (mm)"
          value={shape.diameterMm}
          onChange={(diameterMm) => onChange({ type: "disc", diameterMm })}
        />
      )}

      {shape.type === "arc" && (
        <>
          <NumberField
            label="Ribbon width (mm)"
            value={shape.ribbonWidthMm}
            onChange={(ribbonWidthMm) => onChange({ ...shape, ribbonWidthMm })}
          />
          <NumberField
            label="Ribbon length (mm)"
            value={shape.ribbonLengthMm}
            onChange={(ribbonLengthMm) => onChange({ ...shape, ribbonLengthMm })}
          />
          <NumberField
            label="Nob diameter (mm)"
            value={shape.nobDiameterMm}
            onChange={(nobDiameterMm) => onChange({ ...shape, nobDiameterMm })}
          />
          <NumberField
            label="Nob fillet radius (mm)"
            value={shape.nobFilletRadiusMm ?? DEFAULT_ARC_SHAPE.nobFilletRadiusMm ?? 0}
            disabled={!shape.nobFilletEnabled}
            onChange={(nobFilletRadiusMm) => onChange({ ...shape, nobFilletRadiusMm })}
          />
        </>
      )}
    </Panel>
  );
};
