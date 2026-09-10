import { DEFAULT_ARC_SHAPE } from "../../../core/token/defaultShapeAndStyle";
import { ShapeSpec } from "../../../core/token/types";
import { NumberField } from "../../primitives/NumberField/NumberField";
import { Panel } from "../../primitives/Panel/Panel";

// Generic over the shape it edits, so a caller that owns an arc gets an arc back and one that
// owns a disc gets a disc. A shape's type is fixed by whichever slot of the config it belongs to
// and is not something this editor can change: it just renders the fields of the arm it was
// handed.
export type ShapeEditorProps<T extends ShapeSpec> = {
  shape: T;
  onChange: (shape: T) => void;
};

export const ShapeEditor = <T extends ShapeSpec>({ shape, onChange }: ShapeEditorProps<T>) => {
  return (
    <Panel title="Shape">
      {shape.type === "disc" && (
        <NumberField
          label="Diameter (mm)"
          value={shape.diameterMm}
          onChange={(diameterMm) => onChange({ ...shape, diameterMm })}
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
            label="Stud diameter (mm)"
            value={shape.studDiameterMm}
            onChange={(studDiameterMm) => onChange({ ...shape, studDiameterMm })}
          />
          <NumberField
            label="Stud fillet radius (mm)"
            value={shape.studFilletRadiusMm ?? DEFAULT_ARC_SHAPE.studFilletRadiusMm ?? 0}
            disabled={!shape.studFilletEnabled}
            onChange={(studFilletRadiusMm) => onChange({ ...shape, studFilletRadiusMm })}
          />
        </>
      )}
    </Panel>
  );
};
