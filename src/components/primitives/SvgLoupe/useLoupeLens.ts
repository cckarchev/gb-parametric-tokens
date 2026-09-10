import { MouseEvent, RefObject, useEffect, useRef, useState } from "react";

import {
  CSS_PX_PER_MM,
  computeLoupeTransform,
  PointPx,
  ViewBoxSize,
} from "./computeLoupeTransform";

export const LENS_SIZE_PX = 180;
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

type LoupeLens = {
  trackAreaRef: RefObject<HTMLDivElement | null>;
  lens: LensState | undefined;
  isMagnificationUseful: boolean;
  handleMouseMove: (event: MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: () => void;
};

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

// All the loupe's interactive state and wiring, kept apart from SvgLoupe's render so that file
// stays props-in/markup-out. Mirrors props/state that the native wheel listener below needs to
// read at event time without forcing the listener to be torn down and re-added on every render
// or zoom tick.
export const useLoupeLens = (viewBox: ViewBoxSize): LoupeLens => {
  const trackAreaRef = useRef<HTMLDivElement>(null);
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

  return { trackAreaRef, lens, isMagnificationUseful, handleMouseMove, handleMouseLeave };
};
