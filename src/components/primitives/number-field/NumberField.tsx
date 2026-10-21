import styles from "./NumberField.module.css";

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  // Keeps the label as the field's accessible name without showing it, for a compact inline
  // input (e.g. a per-token copies count sitting next to its own checkbox label).
  hideLabel?: boolean;
  // Renders a compact -/+ stepper around the value instead of a plain number input, sized to
  // sit inline in a single-line row (e.g. next to a checkbox) without growing that row's height.
  stepper?: boolean;
};

const STEP_AMOUNT = 1;

const clamp = (
  value: number,
  min: number | undefined,
  max: number | undefined,
): number => {
  const withMin = min === undefined ? value : Math.max(value, min);

  return max === undefined ? withMin : Math.min(withMin, max);
};

export const NumberField = ({
  label,
  value,
  onChange,
  min,
  max,
  disabled,
  hideLabel,
  stepper,
}: NumberFieldProps) => {
  const labelClassName = hideLabel ? styles.labelHidden : styles.label;

  if (stepper) {
    return (
      <div className={styles.field}>
        <span className={labelClassName}>{label}</span>

        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label={`Decrease ${label}`}
            disabled={disabled || (min !== undefined && value <= min)}
            onClick={() => onChange(clamp(value - STEP_AMOUNT, min, max))}
          >
            −
          </button>

          <input
            className={styles.stepperInput}
            type="number"
            aria-label={label}
            value={value}
            min={min}
            max={max}
            disabled={disabled}
            onChange={(event) =>
              onChange(clamp(Number(event.target.value), min, max))
            }
          />

          <button
            type="button"
            className={styles.stepperButton}
            aria-label={`Increase ${label}`}
            disabled={disabled || (max !== undefined && value >= max)}
            onClick={() => onChange(clamp(value + STEP_AMOUNT, min, max))}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className={styles.field}>
      <span className={labelClassName}>{label}</span>
      <input
        className={styles.input}
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) =>
          onChange(clamp(Number(event.target.value), min, max))
        }
      />
    </label>
  );
};
