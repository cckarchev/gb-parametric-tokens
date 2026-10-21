import {
  type MouseEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CSS_PX_PER_MM,
  computeLoupeTransform,
  type PointPx,
  type ViewBoxSize,
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

const clampZoomFactor = (zoomFactor: number): number =>
  Math.min(MAX_ZOOM_FACTOR, Math.max(MIN_ZOOM_FACTOR, zoomFactor));

const computeLensState = (
  viewBox: ViewBoxSize,
  rect: RectSize,
  cursorPx: PointPx,
  zoomFactor: number,
): LensState => {
  const transform = computeLoupeTransform(
    viewBox,
    rect,
    cursorPx,
    LENS_SIZE_PX,
    zoomFactor,
  );

  return {
    cursorXPx: cursorPx.x,
    cursorYPx: cursorPx.y,
    contentWidthPx: transform.contentWidthPx,
    contentHeightPx: transform.contentHeightPx,
    offsetXPx: transform.offsetXPx,
    offsetYPx: transform.offsetYPx,
  };
};

type ClientPoint = { clientX: number; clientY: number };

// Where a pointer event landed, relative to the rect's top-left corner.
const cursorInRect = (event: ClientPoint, rect: DOMRect): PointPx => ({
  x: event.clientX - rect.left,
  y: event.clientY - rect.top,
});

// The element's rendered width, kept current as the window resizes.
const useElementWidth = (
  elementRef: RefObject<HTMLElement | null>,
): number | undefined => {
  const [widthPx, setWidthPx] = useState<number>();

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const measure = () => {
      setWidthPx(element.getBoundingClientRect().width);
    };

    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [elementRef]);

  return widthPx;
};

// The loupe's state and event wiring. Values the wheel listener reads are mirrored in refs, so the
// listener isn't re-attached on every render or zoom step.
export const useLoupeLens = (viewBox: ViewBoxSize): LoupeLens => {
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const viewBoxRef = useRef(viewBox);
  const zoomFactorRef = useRef(DEFAULT_ZOOM_FACTOR);
  const [lens, setLens] = useState<LensState>();
  const containerWidthPx = useElementWidth(trackAreaRef);

  viewBoxRef.current = viewBox;

  // The lens only helps when the preview is drawn below true size.
  const trueSizeWidthPx = viewBox.width * CSS_PX_PER_MM;
  const isMagnificationUseful =
    containerWidthPx !== undefined && containerWidthPx < trueSizeWidthPx;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const trackArea = trackAreaRef.current;

    if (!trackArea || !isMagnificationUseful) {
      return;
    }

    const rect = trackArea.getBoundingClientRect();
    const cursorPx = cursorInRect(event, rect);

    setLens(computeLensState(viewBox, rect, cursorPx, zoomFactorRef.current));
  };

  const handleMouseLeave = () => {
    setLens(undefined);
  };

  // React's onWheel is passive, so its preventDefault() can't stop the page from scrolling.
  // A native non-passive listener can. It only takes Ctrl+wheel; a plain wheel still scrolls.
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
      const cursorPx = cursorInRect(event, rect);
      const nextZoomFactor = clampZoomFactor(
        zoomFactorRef.current - event.deltaY * ZOOM_SENSITIVITY_PER_DELTA_Y,
      );

      zoomFactorRef.current = nextZoomFactor;
      setLens(
        computeLensState(viewBoxRef.current, rect, cursorPx, nextZoomFactor),
      );
    };

    trackArea.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      trackArea.removeEventListener("wheel", handleWheel);
    };
  }, [isMagnificationUseful]);

  return {
    trackAreaRef,
    lens,
    isMagnificationUseful,
    handleMouseMove,
    handleMouseLeave,
  };
};
