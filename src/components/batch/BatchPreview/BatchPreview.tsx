import { buildContactSheetSvg } from "../../../core/token/export/contactSheetSvg";
import { ColorGroupSpec } from "../../../core/token/types";
import { BatchPreviewItem } from "../../../hooks/useBatch";
import { SvgLoupe } from "../../primitives/SvgLoupe/SvgLoupe";
import styles from "./BatchPreview.module.css";

export type BatchPreviewProps = {
  items: BatchPreviewItem[];
  isPreviewing: boolean;
  validCount: number;
  invalidCount: number;
  colorGroups: ColorGroupSpec[];
};

const CONTACT_SHEET_COLUMNS = 5;

export const BatchPreview = ({
  items,
  isPreviewing,
  validCount,
  invalidCount,
  colorGroups,
}: BatchPreviewProps) => {
  const contactSheet = buildContactSheetSvg(items, CONTACT_SHEET_COLUMNS, colorGroups);

  return (
    <div className={styles.card}>
      <p className={styles.status}>
        {isPreviewing
          ? "Updating preview..."
          : `${validCount} valid, ${invalidCount} invalid of ${items.length} tokens.`}
      </p>
      <SvgLoupe
        svg={contactSheet.svg}
        viewBox={contactSheet.viewBox}
        ariaLabel="Batch contact sheet preview"
        className={styles.svgContainer}
      />
    </div>
  );
};
