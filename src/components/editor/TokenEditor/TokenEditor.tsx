import { useTokenSpec } from "../../../hooks/useTokenSpec";
import { ColorGroupsEditor } from "../ColorGroupsEditor/ColorGroupsEditor";
import { ExportPanel } from "../ExportPanel/ExportPanel";
import { FitPolicyEditor } from "../FitPolicyEditor/FitPolicyEditor";
import { IconsEditor } from "../IconsEditor/IconsEditor";
import { LinesEditor } from "../LinesEditor/LinesEditor";
import { PlateEditor } from "../PlateEditor/PlateEditor";
import { PrintProfileSelector } from "../PrintProfileSelector/PrintProfileSelector";
import { ShapeEditor } from "../ShapeEditor/ShapeEditor";
import { StyleEditor } from "../StyleEditor/StyleEditor";
import { TokenPreview } from "../TokenPreview/TokenPreview";
import { ValidationBanner } from "../ValidationBanner/ValidationBanner";
import styles from "./TokenEditor.module.css";

export const TokenEditor = () => {
  const tokenSpec = useTokenSpec();

  if (tokenSpec.status === "loading") {
    return <p>Loading font and icon registry...</p>;
  }

  if (tokenSpec.status === "error") {
    return <p>Failed to load: {tokenSpec.errorMessage}</p>;
  }

  const { spec, setSpec } = tokenSpec;

  return (
    <div className={styles.layout}>
      <div className={styles.previewColumn}>
        <TokenPreview
          shape={spec.shape}
          reliefComponents={tokenSpec.reliefComponents}
          colorGroups={spec.colorGroups}
        />
      </div>

      <div className={styles.formColumn}>
        <PrintProfileSelector
          printProfileId={spec.printProfileId}
          onChange={(printProfileId) => setSpec({ ...spec, printProfileId })}
        />
        <ShapeEditor shape={spec.shape} onChange={(shape) => setSpec({ ...spec, shape })} />
        <StyleEditor style={spec.style} onChange={(style) => setSpec({ ...spec, style })} />
        <FitPolicyEditor
          fitPolicy={spec.fitPolicy}
          onChange={(fitPolicy) => setSpec({ ...spec, fitPolicy })}
        />

        {spec.shape.type === "arc" && (
          <LinesEditor
            lines={spec.lines}
            colorGroups={spec.colorGroups}
            onChange={(lines) => setSpec({ ...spec, lines })}
          />
        )}

        <IconsEditor
          shapeType={spec.shape.type}
          icons={spec.icons}
          colorGroups={spec.colorGroups}
          manifest={tokenSpec.manifest}
          onChange={(icons) => setSpec({ ...spec, icons })}
        />

        <ColorGroupsEditor
          colorGroups={spec.colorGroups}
          onChange={(colorGroups) => setSpec({ ...spec, colorGroups })}
        />

        <PlateEditor plateLayout={tokenSpec.plateLayout} onChange={tokenSpec.setPlateLayout} />

        <ValidationBanner
          isValidating={tokenSpec.isValidating}
          validation={tokenSpec.validation}
          warnings={tokenSpec.warnings}
        />

        <ExportPanel
          onExportThreeMf={tokenSpec.exportThreeMf}
          exportError={tokenSpec.exportError}
          onExportSpecJson={tokenSpec.exportSpecJson}
          onImportSpecJson={tokenSpec.importSpecJson}
          importError={tokenSpec.importError}
        />
      </div>
    </div>
  );
};
