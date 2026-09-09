import { buildContactSheetSvg } from "../../../core/token/export/contactSheetSvg";
import { ColorGroupSpec } from "../../../core/token/types";
import { PreviewItem } from "../../../hooks/useTokenGenerator";
import { SvgLoupe } from "../../primitives/SvgLoupe/SvgLoupe";
import styles from "./TokenPreview.module.css";

export type TokenPreviewProps = {
  items: PreviewItem[];
  isPreviewing: boolean;
  validCount: number;
  invalidCount: number;
  colorGroups: ColorGroupSpec[];
};

const CONTACT_SHEET_COLUMNS = 5;

export const TokenPreview = ({
  items,
  isPreviewing,
  validCount,
  invalidCount,
  colorGroups,
}: TokenPreviewProps) => {
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
        ariaLabel="Token contact sheet preview"
        className={styles.svgContainer}
      />
    </div>
  );
};
