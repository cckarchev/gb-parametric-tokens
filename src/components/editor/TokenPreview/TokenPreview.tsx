import { useEffect, useState } from "react";

import { CENTER_ANGLE_DEG } from "../../../core/token/geometry/angleConventions";
import { ReliefComponent } from "../../../core/token/mesh/reliefComponent";
import { buildPreviewSvg } from "../../../core/token/preview/buildPreviewSvg";
import { computeBaseOutlineContours } from "../../../core/token/preview/computeBaseOutlineContours";
import { RenderedSvg } from "../../../core/token/preview/svgGrid";
import { ColorGroupSpec, ShapeSpec } from "../../../core/token/types";
import { SvgLoupe } from "../../primitives/SvgLoupe/SvgLoupe";
import styles from "./TokenPreview.module.css";

type TokenPreviewProps = {
  shape: ShapeSpec;
  reliefComponents: ReliefComponent[];
  colorGroups: ColorGroupSpec[];
};

export const TokenPreview = ({ shape, reliefComponents, colorGroups }: TokenPreviewProps) => {
  const [preview, setPreview] = useState<RenderedSvg>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    computeBaseOutlineContours(shape, CENTER_ANGLE_DEG)
      .then((baseContours) => {
        if (cancelled) {
          return;
        }

        setError(undefined);
        setPreview(buildPreviewSvg(baseContours, reliefComponents, colorGroups, shape));
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
      });

    return () => {
      cancelled = true;
    };
  }, [shape, reliefComponents, colorGroups]);

  if (error) {
    return (
      <div className={styles.card}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className={styles.card}>
        <p>Rendering preview...</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <SvgLoupe
        svg={preview.svg}
        viewBox={preview.viewBox}
        ariaLabel="Token preview"
        className={styles.svgContainer}
      />
    </div>
  );
};
