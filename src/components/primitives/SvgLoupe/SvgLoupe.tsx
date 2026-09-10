import { MouseEvent, useEffect, useRef, useState } from "react";

import {
  CSS_PX_PER_MM,
  computeLoupeTransform,
  PointPx,
  ViewBoxSize,
} from "./computeLoupeTransform";
import styles from "./SvgLoupe.module.css";

type SvgLoupeProps = {
  svg: string;
  viewBox: ViewBoxSize;
  ariaLabel: string;
  className?: string;
};

const LENS_SIZE_PX = 180;
const DEFAULT_ZOOM_FACTOR = 2;
const MIN_ZOOM_FACTOR = 1;
const MAX_ZOOM_FACTOR = 8;
// How much zoomFactor changes per unit of wheel deltaY; a typical mouse-wheel notch
// (deltaY ~= 100) then moves the zoom by roughly 0.3.
const ZOOM_SENSITIVITY_PER_DELTA_Y = 0.003;

type LensState = {
  cursorXPx: number;
  cursorYPx: number;
  contentWidthPx: number;
  contentHeightPx: number;
  offsetXPx: number;
  offsetYPx: number;
};

type RectSize = { width: number; height: number };

const clampZoomFactor = (zoomFactor: number): number => {
  return Math.min(MAX_ZOOM_FACTOR, Math.max(MIN_ZOOM_FACTOR, zoomFactor));
};

const computeLensState = (
  viewBox: ViewBoxSize,
  rect: RectSize,
  cursorPx: PointPx,
  zoomFactor: number,
): LensState => {
  const transform = computeLoupeTransform(viewBox, rect, cursorPx, LENS_SIZE_PX, zoomFactor);

  return {
    cursorXPx: cursorPx.x,
    cursorYPx: cursorPx.y,
    contentWidthPx: transform.contentWidthPx,
    contentHeightPx: transform.contentHeightPx,
    offsetXPx: transform.offsetXPx,
    offsetYPx: transform.offsetYPx,
  };
};

export const SvgLoupe = ({ svg, viewBox, ariaLabel, className }: SvgLoupeProps) => {
  const trackAreaRef = useRef<HTMLDivElement>(null);
  // Mirrors props/state that the native wheel listener below needs to read at event time
  // without forcing the listener to be torn down and re-added on every render or zoom tick.
  const viewBoxRef = useRef(viewBox);
  const zoomFactorRef = useRef(DEFAULT_ZOOM_FACTOR);
  const [lens, setLens] = useState<LensState>();
  const [containerWidthPx, setContainerWidthPx] = useState<number>();

  viewBoxRef.current = viewBox;

  // The lens only helps when the preview is currently drawn smaller than the token's true
  // physical size (e.g. a full contact sheet shrunk to fit the panel); once it's already
  // shown at or above true size (e.g. a single big token), magnifying it further adds
  // nothing, so the whole hover/zoom affordance is skipped rather than shown for no reason.
  const trueSizeWidthPx = viewBox.width * CSS_PX_PER_MM;
  const isMagnificationUseful =
    containerWidthPx !== undefined && containerWidthPx < trueSizeWidthPx;

  useEffect(() => {
    const trackArea = trackAreaRef.current;

    if (!trackArea) {
      return;
    }

    const measure = () => {
      setContainerWidthPx(trackArea.getBoundingClientRect().width);
    };

    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, []);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const trackArea = trackAreaRef.current;

    if (!trackArea || !isMagnificationUseful) {
      return;
    }

    const rect = trackArea.getBoundingClientRect();
    const cursorPx = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    setLens(computeLensState(viewBox, rect, cursorPx, zoomFactorRef.current));
  };

  const handleMouseLeave = () => {
    setLens(undefined);
  };

  // A React onWheel prop is attached passively (matching the browser's own scroll-perf
  // default for wheel listeners), so preventDefault() through it cannot stop the rest of
  // the page from scrolling underneath the lens. A native, explicitly non-passive listener
  // is what lets this handler own the wheel gesture, but only while Ctrl is held: a plain
  // wheel must fall through untouched so the page can still scroll past the preview.
  useEffect(() => {
    const trackArea = trackAreaRef.current;

    if (!trackArea || !isMagnificationUseful) {
      return;
    }

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();

      const rect = trackArea.getBoundingClientRect();
      const cursorPx = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const nextZoomFactor = clampZoomFactor(
        zoomFactorRef.current - event.deltaY * ZOOM_SENSITIVITY_PER_DELTA_Y,
      );

      zoomFactorRef.current = nextZoomFactor;
      setLens(computeLensState(viewBoxRef.current, rect, cursorPx, nextZoomFactor));
    };

    trackArea.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      trackArea.removeEventListener("wheel", handleWheel);
    };
  }, [isMagnificationUseful]);

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
