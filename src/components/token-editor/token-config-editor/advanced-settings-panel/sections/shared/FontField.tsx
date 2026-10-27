import {
  SelectField,
  type SelectFieldOption,
} from "@/components/primitives/select-field/SelectField";
import { FONT_CATALOG } from "@/core/token/text/fontCatalog";

const FONT_OPTIONS: SelectFieldOption<string>[] = FONT_CATALOG.map((entry) => ({
  value: entry.id,
  label: entry.name,
}));

type FontFieldProps = {
  fontId: string;
  onChange: (fontId: string) => void;
};

export const FontField = ({ fontId, onChange }: FontFieldProps) => (
  <SelectField
    label="Font"
    value={fontId}
    options={FONT_OPTIONS}
    onChange={onChange}
  />
);
