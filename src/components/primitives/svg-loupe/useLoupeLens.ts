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
import { useCtrlWheelZoom } from "./useCtrlWheelZoom";
import { type LoupeKeyboard, useLoupeKeyboard } from "./useLoupeKeyboard";

export const LENS_SIZE_PX = 180;
const DEFAULT_ZOOM_FACTOR = 2;
const MIN_ZOOM_FACTOR = 1;
const MAX_ZOOM_FACTOR = 8;
// How much zoomFactor changes per unit of wheel deltaY; a typical mouse-wheel
// notch (deltaY ~= 100) then moves the zoom by roughly 0.3.
const ZOOM_SENSITIVITY_PER_DELTA_Y = 0.003;

type LensState = {
  cursorPxX: number;
  cursorPxY: number;
  contentWidthPx: number;
  contentHeightPx: number;
  offsetPxX: number;
  offsetPxY: number;
};

type RectSize = { width: number; height: number };

type LoupeLens = LoupeKeyboard & {
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
    cursorPxX: cursorPx.x,
    cursorPxY: cursorPx.y,
    contentWidthPx: transform.contentWidthPx,
    contentHeightPx: transform.contentHeightPx,
    offsetPxX: transform.offsetPxX,
    offsetPxY: transform.offsetPxY,
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

// The loupe's state and event wiring.
export const useLoupeLens = (viewBox: ViewBoxSize): LoupeLens => {
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const zoomFactorRef = useRef(DEFAULT_ZOOM_FACTOR);
  const cursorRef = useRef<PointPx>(undefined);
  const [lens, setLens] = useState<LensState>();
  const containerWidthPx = useElementWidth(trackAreaRef);

  // The lens only helps when the preview is drawn below true size.
  const trueSizeWidthPx = viewBox.width * CSS_PX_PER_MM;
  const isMagnificationUseful =
    containerWidthPx !== undefined && containerWidthPx < trueSizeWidthPx;

  const showLensAt = (rect: DOMRect, cursorPx: PointPx) => {
    cursorRef.current = cursorPx;
    setLens(computeLensState(viewBox, rect, cursorPx, zoomFactorRef.current));
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const trackArea = trackAreaRef.current;

    if (!trackArea || !isMagnificationUseful) {
      return;
    }

    const rect = trackArea.getBoundingClientRect();

    showLensAt(rect, cursorInRect(event, rect));
  };

  const handleMouseLeave = () => {
    setLens(undefined);
  };

  const zoomBy = (delta: number) => {
    zoomFactorRef.current = clampZoomFactor(zoomFactorRef.current + delta);
  };

  const keyboard = useLoupeKeyboard({
    trackAreaRef,
    isMagnificationUseful,
    cursorRef,
    showLensAt,
    hideLens: handleMouseLeave,
    zoomBy,
  });

  const handleCtrlWheel = (event: WheelEvent) => {
    const trackArea = trackAreaRef.current;

    if (!trackArea) {
      return;
    }

    const rect = trackArea.getBoundingClientRect();

    zoomBy(-event.deltaY * ZOOM_SENSITIVITY_PER_DELTA_Y);
    showLensAt(rect, cursorInRect(event, rect));
  };

  useCtrlWheelZoom(trackAreaRef, isMagnificationUseful, handleCtrlWheel);

  return {
    trackAreaRef,
    lens,
    isMagnificationUseful,
    handleMouseMove,
    handleMouseLeave,
    ...keyboard,
  };
};
