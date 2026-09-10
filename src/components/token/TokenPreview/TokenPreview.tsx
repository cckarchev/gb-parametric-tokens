import { buildContactSheetSvg } from "../../../core/token/export/contactSheetSvg";
import { ColorGroupSpec } from "../../../core/token/types";
import { PreviewItem } from "../../../hooks/useTokenGenerator";
import { SvgLoupe } from "../../primitives/SvgLoupe/SvgLoupe";
import styles from "./TokenPreview.module.css";

type TokenPreviewProps = {
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
    <SvgLoupe
      svg={contactSheet.svg}
      viewBox={contactSheet.viewBox}
      ariaLabel="Token contact sheet preview"
      className={svgContainerClassName}
    />
  );
};
