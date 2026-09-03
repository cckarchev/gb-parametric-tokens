import { PRINT_PROFILES } from "../../../core/token/printProfiles";
import { SelectField } from "../../primitives/SelectField/SelectField";

export type PrintProfileSelectorProps = {
  printProfileId: string;
  onChange: (printProfileId: string) => void;
};

export const PrintProfileSelector = ({ printProfileId, onChange }: PrintProfileSelectorProps) => {
  const options = Object.values(PRINT_PROFILES).map((profile) => ({
    value: profile.id,
    label: profile.name,
  }));

  return (
    <SelectField
      label="Print profile"
      value={printProfileId}
      options={options}
      onChange={onChange}
    />
  );
};
