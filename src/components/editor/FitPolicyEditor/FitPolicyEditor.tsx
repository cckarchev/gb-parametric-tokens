import { FitPolicy } from "../../../core/token/types";
import { CheckboxField } from "../../primitives/CheckboxField/CheckboxField";
import { NumberField } from "../../primitives/NumberField/NumberField";

type FitPolicyEditorProps = {
  fitPolicy: FitPolicy;
  onChange: (fitPolicy: FitPolicy) => void;
};

export const FitPolicyEditor = ({ fitPolicy, onChange }: FitPolicyEditorProps) => {
  return (
    <>
      <NumberField
        label="Min tracking (mm)"
        value={fitPolicy.minTracking}
        onChange={(minTracking) => onChange({ ...fitPolicy, minTracking })}
      />
      <NumberField
        label="Max tracking (mm)"
        value={fitPolicy.maxTracking}
        onChange={(maxTracking) => onChange({ ...fitPolicy, maxTracking })}
      />
      <NumberField
        label="Min scale"
        value={fitPolicy.minScale}
        onChange={(minScale) => onChange({ ...fitPolicy, minScale })}
      />
      <CheckboxField
        label="Allow two lines"
        checked={fitPolicy.allowTwoLines}
        onChange={(allowTwoLines) => onChange({ ...fitPolicy, allowTwoLines })}
      />
    </>
  );
};
