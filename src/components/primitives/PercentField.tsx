import { NumberField } from "./number-field/NumberField";

const PERCENT_PER_UNIT = 100;

type PercentFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
};

const toPercent = (fraction: number): number =>
  Math.round(fraction * PERCENT_PER_UNIT);

const toPercentBound = (fraction: number | undefined): number | undefined =>
  fraction === undefined ? undefined : toPercent(fraction);

// Scales live in the config as fractions (0.55); people think of them as
// percentages (55 %).
export const PercentField = ({
  label,
  value,
  onChange,
  min,
  max,
  disabled,
}: PercentFieldProps) => (
  <NumberField
    label={label}
    value={toPercent(value)}
    min={toPercentBound(min)}
    max={toPercentBound(max)}
    disabled={disabled}
    onChange={(percent) => onChange(percent / PERCENT_PER_UNIT)}
  />
);
