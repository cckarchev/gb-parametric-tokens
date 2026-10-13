import { BASE_THICKNESS_BOUNDS, RELIEF_HEIGHT_BOUNDS } from "@/components/editor/fieldBounds";
import { FitPolicyEditor } from "@/components/editor/fit-policy-editor/FitPolicyEditor";
import { NumberField } from "@/components/primitives/number-field/NumberField";
import { SettingsGroup } from "@/components/primitives/settings-group/SettingsGroup";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/tokenItems/defaultSharedConfig";

import { SettingsFileGroup } from "../../settings-file-group/SettingsFileGroup";
import { SectionPanel, SectionProps } from "./section-panel/SectionPanel";

type GeneralSectionProps = SectionProps & {
  onExportSettings: () => void;
  onImportSettings: (file: File) => void;
  importSettingsError: string | undefined;
};

export const GeneralSection = ({
  sharedConfig,
  onChange,
  onExportSettings,
  onImportSettings,
  importSettingsError,
}: GeneralSectionProps) => {
  const { style } = sharedConfig;

  // Relief (raised or engraved) lives in print options, so the reset keeps it.
  const reset = () => {
    onChange({
      ...sharedConfig,
      style: { ...DEFAULT_SHARED_CONFIG.style, relief: style.relief },
      fitPolicy: DEFAULT_SHARED_CONFIG.fitPolicy,
    });
  };

  return (
    <SectionPanel title="General" onReset={reset}>
      <SettingsFileGroup
        onExportSettings={onExportSettings}
        onImportSettings={onImportSettings}
        importSettingsError={importSettingsError}
      />

      <NumberField
        label="Relief height (mm)"
        value={style.reliefHeightMm}
        {...RELIEF_HEIGHT_BOUNDS}
        onChange={(reliefHeightMm) =>
          onChange({ ...sharedConfig, style: { ...style, reliefHeightMm } })
        }
      />
      <NumberField
        label="Base thickness (mm)"
        value={style.baseThicknessMm}
        {...BASE_THICKNESS_BOUNDS}
        onChange={(baseThicknessMm) =>
          onChange({ ...sharedConfig, style: { ...style, baseThicknessMm } })
        }
      />

      <SettingsGroup title="Fit policy">
        <FitPolicyEditor
          fitPolicy={sharedConfig.fitPolicy}
          onChange={(fitPolicy) => onChange({ ...sharedConfig, fitPolicy })}
        />
      </SettingsGroup>
    </SectionPanel>
  );
};
