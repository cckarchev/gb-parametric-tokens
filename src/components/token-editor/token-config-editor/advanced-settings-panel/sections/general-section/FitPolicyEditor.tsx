import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import type { FitPolicy } from "@/core/token/types";

type FitPolicyEditorProps = {
  fitPolicy: FitPolicy;
  onChange: (fitPolicy: FitPolicy) => void;
};

export const FitPolicyEditor = ({
  fitPolicy,
  onChange,
}: FitPolicyEditorProps) => (
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
