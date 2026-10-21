import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import { DEFAULT_ARC_SHAPE } from "@/core/token/defaultShapeAndStyle";
import type { ShapeSpec } from "@/core/token/types";

import {
  DISC_DIAMETER_BOUNDS,
  FILLET_RADIUS_BOUNDS,
  RIBBON_LENGTH_BOUNDS,
  RIBBON_WIDTH_BOUNDS,
  STUD_DIAMETER_BOUNDS,
} from "./fieldBounds";

// Generic over the shape, so an arc comes back as an arc and a disc as a disc. The type is fixed
// by the config slot; this only edits its fields.
type ShapeEditorProps<T extends ShapeSpec> = {
  shape: T;
  onChange: (shape: T) => void;
};

export const ShapeEditor = <T extends ShapeSpec>({
  shape,
  onChange,
}: ShapeEditorProps<T>) => {
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
        onChange={(studFilletEnabled) =>
          onChange({ ...shape, studFilletEnabled })
        }
      />
      <NumberField
        label="Stud fillet radius (mm)"
        value={
          shape.studFilletRadiusMm ?? DEFAULT_ARC_SHAPE.studFilletRadiusMm ?? 0
        }
        {...FILLET_RADIUS_BOUNDS}
        disabled={!shape.studFilletEnabled}
        onChange={(studFilletRadiusMm) =>
          onChange({ ...shape, studFilletRadiusMm })
        }
      />
    </>
  );
};
