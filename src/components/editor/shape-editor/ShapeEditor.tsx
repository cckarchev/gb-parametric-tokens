import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import { DEFAULT_ARC_SHAPE } from "@/core/token/defaultShapeAndStyle";
import { ShapeSpec } from "@/core/token/types";

import {
  DISC_DIAMETER_BOUNDS,
  FILLET_RADIUS_BOUNDS,
  RIBBON_LENGTH_BOUNDS,
  RIBBON_WIDTH_BOUNDS,
  STUD_DIAMETER_BOUNDS,
} from "../fieldBounds";

// Generic over the shape it edits, so a caller that owns an arc gets an arc back and one that
// owns a disc gets a disc. A shape's type is fixed by whichever slot of the config it belongs to
// and is not something this editor can change: it just renders the fields of the arm it was
// handed, inside whatever section its caller puts it in.
type ShapeEditorProps<T extends ShapeSpec> = {
  shape: T;
  onChange: (shape: T) => void;
};

export const ShapeEditor = <T extends ShapeSpec>({ shape, onChange }: ShapeEditorProps<T>) => {
  if (shape.type === "disc") {
    return (
      <NumberField
        label="Diameter (mm)"
        value={shape.diameterMm}
        {...DISC_DIAMETER_BOUNDS}
        onChange={(diameterMm) => onChange({ ...shape, diameterMm })}
      />
    );
  }

  return (
    <>
      <NumberField
        label="Ribbon width (mm)"
        value={shape.ribbonWidthMm}
        {...RIBBON_WIDTH_BOUNDS}
        onChange={(ribbonWidthMm) => onChange({ ...shape, ribbonWidthMm })}
      />
      <NumberField
        label="Ribbon length (mm)"
        value={shape.ribbonLengthMm}
        {...RIBBON_LENGTH_BOUNDS}
        onChange={(ribbonLengthMm) => onChange({ ...shape, ribbonLengthMm })}
      />
      <NumberField
        label="Stud diameter (mm)"
        value={shape.studDiameterMm}
        {...STUD_DIAMETER_BOUNDS}
        onChange={(studDiameterMm) => onChange({ ...shape, studDiameterMm })}
      />
      <CheckboxField
        label="Fillet between stud and arc"
        checked={shape.studFilletEnabled ?? false}
        onChange={(studFilletEnabled) => onChange({ ...shape, studFilletEnabled })}
      />
      <NumberField
        label="Stud fillet radius (mm)"
        value={shape.studFilletRadiusMm ?? DEFAULT_ARC_SHAPE.studFilletRadiusMm ?? 0}
        {...FILLET_RADIUS_BOUNDS}
        disabled={!shape.studFilletEnabled}
        onChange={(studFilletRadiusMm) => onChange({ ...shape, studFilletRadiusMm })}
      />
    </>
  );
};
