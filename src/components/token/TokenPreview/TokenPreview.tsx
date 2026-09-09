import { buildContactSheetSvg } from "../../../core/token/export/contactSheetSvg";
import { ColorGroupSpec } from "../../../core/token/types";
import { PreviewItem } from "../../../hooks/useTokenGenerator";
import { SvgLoupe } from "../../primitives/SvgLoupe/SvgLoupe";
import styles from "./TokenPreview.module.css";

export type TokenPreviewProps = {
  items: PreviewItem[];
  isPreviewing: boolean;
  colorGroups: ColorGroupSpec[];
};

const CONTACT_SHEET_COLUMNS = 5;

export const TokenPreview = ({ items, isPreviewing, colorGroups }: TokenPreviewProps) => {
  const contactSheet = buildContactSheetSvg(items, CONTACT_SHEET_COLUMNS, colorGroups);

  const svgContainerClassName = isPreviewing
    ? `${styles.svgContainer} ${styles.svgContainerLoading}`
    : styles.svgContainer;

  return (
    <div className={styles.card}>
      {/* The settled valid/invalid count lives next to the download button (ExportPanel) instead
          of here -- that's the moment it's actually actionable. Only the in-flight state stays
          attached to the image it describes. */}
      {isPreviewing && <p className={styles.status}>Updating preview...</p>}
      <SvgLoupe
        svg={contactSheet.svg}
        viewBox={contactSheet.viewBox}
        ariaLabel="Token contact sheet preview"
        className={svgContainerClassName}
      />
    </div>
  );
};
