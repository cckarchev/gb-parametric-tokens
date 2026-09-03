import { NumberField } from "../primitives/NumberField";

export type CounterCountFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const COUNTER_MIN_VALUE = 0;
const COUNTER_MAX_VALUE = 20;

export const CounterCountField = ({ label, value, onChange }: CounterCountFieldProps) => {
  return (
    <NumberField
      label={label}
      value={value}
      min={COUNTER_MIN_VALUE}
      max={COUNTER_MAX_VALUE}
      onChange={onChange}
    />
  );
};
