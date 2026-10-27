import { type RefObject, useEffect, useRef } from "react";

// React's onWheel is passive, so its preventDefault() can't stop the page from
// zooming. A native non-passive listener can. It only takes Ctrl+wheel; a
// plain wheel still scrolls. The latest callback is kept in a ref, so the
// listener isn't re-attached on every render.
export const useCtrlWheelZoom = (
  elementRef: RefObject<HTMLElement | null>,
  isEnabled: boolean,
  onCtrlWheel: (event: WheelEvent) => void,
) => {
  const onCtrlWheelRef = useRef(onCtrlWheel);

  onCtrlWheelRef.current = onCtrlWheel;

  useEffect(() => {
    const element = elementRef.current;

    if (!element || !isEnabled) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();
      onCtrlWheelRef.current(event);
    };

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [elementRef, isEnabled]);
};
