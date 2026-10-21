import { useState } from "react";

import type { PreviewItem } from "@/browser/tokenWorker";
import { CheckboxField } from "@/components/primitives/checkbox-field/CheckboxField";
import { SvgLoupe } from "@/components/primitives/svg-loupe/SvgLoupe";
import { buildContactSheetSvg } from "@/core/token/export/contact-sheet/contactSheetSvg";
import type { ColorGroupSpec } from "@/core/token/types";

import styles from "./TokenPreview.module.css";

type TokenPreviewProps = {
  items: PreviewItem[];
  isPreviewing: boolean;
  colorGroups: ColorGroupSpec[];
};

const CONTACT_SHEET_COLUMNS = 5;

export const TokenPreview = ({
  items,
  isPreviewing,
  colorGroups,
}: TokenPreviewProps) => {
  const [showBaseReference, setShowBaseReference] = useState(true);

  const contactSheet = buildContactSheetSvg(
    items,
    CONTACT_SHEET_COLUMNS,
    colorGroups,
    {
      showBaseReference,
    },
  );

  const svgContainerClassName = isPreviewing
    ? `${styles.svgContainer} ${styles.svgContainerLoading}`
    : styles.svgContainer;

  return (
    <div className={styles.preview}>
      <SvgLoupe
        svg={contactSheet.svg}
        viewBox={contactSheet.viewBox}
        ariaLabel="Token contact sheet preview"
        className={svgContainerClassName}
      />

      <CheckboxField
        label="Show 30mm base"
        checked={showBaseReference}
        onChange={setShowBaseReference}
      />
    </div>
  );
};
