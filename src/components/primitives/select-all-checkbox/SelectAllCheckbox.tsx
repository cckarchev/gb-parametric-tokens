import { CheckboxField } from "../checkbox-field/CheckboxField";

type SelectAllCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

// The bare checkbox a list panel hangs off its own header to turn every row on or off at once.
// Its label is hidden: sitting in the header is already what says what it does, and showing the
// words next to the panel's own title read as a second title.
export const SelectAllCheckbox = ({ checked, onChange, disabled }: SelectAllCheckboxProps) => {
  return (
    <CheckboxField
      label="Select all"
      hideLabel
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
};
