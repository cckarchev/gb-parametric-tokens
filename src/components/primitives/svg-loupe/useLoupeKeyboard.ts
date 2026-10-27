import { type KeyboardEvent, type RefObject, useState } from "react";

import type { PointPx } from "./computeLoupeTransform";
import { areaCenter, nudgeCursor, zoomDeltaForKey } from "./keyboardLoupe";

type LoupeKeyboardOptions = {
  trackAreaRef: RefObject<HTMLDivElement | null>;
  isMagnificationUseful: boolean;
  // Where the lens was last shown, so the arrow keys move on from there.
  cursorRef: RefObject<PointPx | undefined>;
  showLensAt: (rect: DOMRect, cursorPx: PointPx) => void;
  hideLens: () => void;
  zoomBy: (delta: number) => void;
};

export type LoupeKeyboard = {
  isKeyboardActive: boolean;
  handleFocus: () => void;
  handleBlur: () => void;
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

// Keyboard users get the lens while the preview has the focus, starting at
// its center: arrows move it, +/- zoom it.
export const useLoupeKeyboard = ({
  trackAreaRef,
  isMagnificationUseful,
  cursorRef,
  showLensAt,
  hideLens,
  zoomBy,
}: LoupeKeyboardOptions): LoupeKeyboard => {
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  const handleFocus = () => {
    const trackArea = trackAreaRef.current;

    if (!trackArea || !isMagnificationUseful) {
      return;
    }

    const rect = trackArea.getBoundingClientRect();

    setIsKeyboardActive(true);
    showLensAt(rect, areaCenter(rect));
  };

  const handleBlur = () => {
    setIsKeyboardActive(false);
    hideLens();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const trackArea = trackAreaRef.current;
    // Ctrl or Cmd with +/- is the browser zoom; leave it alone.
    const isBrowserShortcut = event.ctrlKey || event.metaKey;

    if (!trackArea || !isMagnificationUseful || isBrowserShortcut) {
      return;
    }

    const rect = trackArea.getBoundingClientRect();
    const cursorPx = cursorRef.current ?? areaCenter(rect);
    const nudgedCursorPx = nudgeCursor(cursorPx, event.key, rect);
    const zoomDelta = zoomDeltaForKey(event.key);

    if (!nudgedCursorPx && zoomDelta === undefined) {
      return;
    }

    event.preventDefault();

    if (zoomDelta !== undefined) {
      zoomBy(zoomDelta);
    }

    showLensAt(rect, nudgedCursorPx ?? cursorPx);
  };

  return { isKeyboardActive, handleFocus, handleBlur, handleKeyDown };
};
