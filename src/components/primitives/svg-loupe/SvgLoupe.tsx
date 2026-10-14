import { ViewBoxSize } from "./computeLoupeTransform";
import styles from "./SvgLoupe.module.css";
import { LENS_SIZE_PX, useLoupeLens } from "./useLoupeLens";

type SvgLoupeProps = {
  svg: string;
  viewBox: ViewBoxSize;
  ariaLabel: string;
  className?: string;
};

export const SvgLoupe = ({ svg, viewBox, ariaLabel, className }: SvgLoupeProps) => {
  const { trackAreaRef, lens, isMagnificationUseful, handleMouseMove, handleMouseLeave } =
    useLoupeLens(viewBox);

  return (
    <div className={className}>
      {/* The lens is positioned absolutely against this anchor, not against trackArea itself,
          because trackArea's own content is fully owned by dangerouslySetInnerHTML and can't
          also host the lens as a sibling node. The anchor has no padding of its own, so it
          shares trackArea's exact origin and the lens's left/top land exactly on the cursor. */}
      <div className={styles.positionAnchor}>
        <div
          ref={trackAreaRef}
          className={styles.trackArea}
          aria-label={ariaLabel}
          role="img"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          // Trusted markup generated locally from numeric geometry, not user input.
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        {isMagnificationUseful && <span className={styles.zoomHint}>Ctrl+Scroll to zoom</span>}

        {lens && (
          <div
            className={styles.lens}
            style={{
              left: lens.cursorXPx - LENS_SIZE_PX / 2,
              top: lens.cursorYPx - LENS_SIZE_PX / 2,
              width: LENS_SIZE_PX,
              height: LENS_SIZE_PX,
            }}>
            <div
              className={styles.lensContent}
              style={{
                width: lens.contentWidthPx,
                height: lens.contentHeightPx,
                transform: `translate(${lens.offsetXPx}px, ${lens.offsetYPx}px)`,
              }}
              // Trusted markup generated locally from numeric geometry, not user input.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
