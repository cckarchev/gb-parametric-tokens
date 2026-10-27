// @vitest-environment happy-dom
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SvgLoupe } from "./SvgLoupe";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M0,0 L20,0 L20,20 L0,20 Z" /></svg>';

// 100mm is comfortably larger than the 200px the mocked rect below reports, so
// the preview counts as "shrunk" and the magnification affordance is enabled in
// these tests.
const shrunkViewBox = { width: 100, height: 100 };
// Narrower than shrunkViewBox at true size, so the preview is drawn shrunk and
// the lens helps.
const CONTAINER_WIDTH_PX = 200;

// 10mm at true size is far smaller than the mocked 200px rect, so the preview
// is already shown above true size and magnification should be skipped
// entirely.
const alreadyBigViewBox = { width: 10, height: 10 };

const mockContainerWidth = (widthPx: number) => {
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: widthPx, height: widthPx }) as DOMRect;
};

// happy-dom's WheelEvent ignores `ctrlKey` in its init, so it's set on the
// instance. fireEvent wraps the dispatch in act(), so state is flushed before
// the assertions.
const dispatchWheel = (
  target: Element,
  init: { deltaY: number; clientX: number; clientY: number; ctrlKey: boolean },
): WheelEvent => {
  const wheelEvent = createEvent.wheel(target, {
    deltaY: init.deltaY,
    clientX: init.clientX,
    clientY: init.clientY,
  }) as WheelEvent;

  Object.defineProperty(wheelEvent, "ctrlKey", { value: init.ctrlKey });
  fireEvent(target, wheelEvent);

  return wheelEvent;
};

describe("SvgLoupe", () => {
  it("renders the svg content under the given aria label", () => {
    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    const container = screen.getByRole("img", { name: "Token preview" });

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("shows no lens before the mouse ever moves over it", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);
    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    expect(
      screen.getByRole("img", { name: "Token preview" }).parentElement
        ?.children,
    ).toHaveLength(2);
  });

  it("shows a magnified lens copy of the svg while hovering, and hides it again on mouse leave", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);

    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    const trackArea = screen.getByRole("img", { name: "Token preview" });

    fireEvent.mouseMove(trackArea, { clientX: 100, clientY: 100 });

    const wrapper = trackArea.parentElement;
    expect(wrapper?.querySelectorAll("svg").length).toBe(2);

    fireEvent.mouseLeave(trackArea);

    expect(wrapper?.querySelectorAll("svg").length).toBe(1);
  });
});

describe("SvgLoupe Ctrl+scroll zoom", () => {
  it("zooms the lens in when scrolling up with Ctrl held while hovering", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);

    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    const trackArea = screen.getByRole("img", { name: "Token preview" });

    fireEvent.mouseMove(trackArea, { clientX: 100, clientY: 100 });
    const lensContentBefore = trackArea.parentElement?.querySelectorAll(
      "svg",
    )[1].parentElement as HTMLElement;
    const widthBefore = Number(lensContentBefore.style.width.replace("px", ""));

    dispatchWheel(trackArea, {
      deltaY: -100,
      clientX: 100,
      clientY: 100,
      ctrlKey: true,
    });
    const lensContentAfter = trackArea.parentElement?.querySelectorAll("svg")[1]
      .parentElement as HTMLElement;
    const widthAfter = Number(lensContentAfter.style.width.replace("px", ""));

    expect(widthAfter).toBeGreaterThan(widthBefore);
  });

  it("zooms in on a Ctrl+scroll even without a prior mousemove, at the scrolled-over point", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);

    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    const trackArea = screen.getByRole("img", { name: "Token preview" });

    dispatchWheel(trackArea, {
      deltaY: -100,
      clientX: 100,
      clientY: 100,
      ctrlKey: true,
    });

    expect(trackArea.parentElement?.querySelectorAll("svg").length).toBe(2);
  });
});

describe("SvgLoupe plain scrolling", () => {
  it("prevents the wheel event's default action when Ctrl is held, so the page doesn't zoom instead", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);

    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    const trackArea = screen.getByRole("img", { name: "Token preview" });
    const wheelEvent = dispatchWheel(trackArea, {
      deltaY: -100,
      clientX: 100,
      clientY: 100,
      ctrlKey: true,
    });

    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it("leaves a plain scroll (no Ctrl) alone, so the rest of the page keeps scrolling", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);

    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    const trackArea = screen.getByRole("img", { name: "Token preview" });
    const wheelEvent = dispatchWheel(trackArea, {
      deltaY: -100,
      clientX: 100,
      clientY: 100,
      ctrlKey: false,
    });

    expect(wheelEvent.defaultPrevented).toBe(false);
    expect(trackArea.parentElement?.querySelectorAll("svg").length).toBe(1);
  });

  it("shows a hint that Ctrl+Scroll zooms while magnification is useful", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);

    render(
      <SvgLoupe svg={svg} viewBox={shrunkViewBox} ariaLabel="Token preview" />,
    );

    expect(screen.getByText("Ctrl+Scroll to zoom")).not.toBeNull();
  });
});

describe("SvgLoupe at true size", () => {
  it("skips the whole magnification affordance when the preview is already shown at or above true size", () => {
    mockContainerWidth(CONTAINER_WIDTH_PX);

    render(
      <SvgLoupe
        svg={svg}
        viewBox={alreadyBigViewBox}
        ariaLabel="Token preview"
      />,
    );

    const trackArea = screen.getByRole("img", { name: "Token preview" });

    expect(screen.queryByText("Ctrl+Scroll to zoom")).toBeNull();

    fireEvent.mouseMove(trackArea, { clientX: 100, clientY: 100 });
    expect(trackArea.parentElement?.querySelectorAll("svg").length).toBe(1);

    const wheelEvent = dispatchWheel(trackArea, {
      deltaY: -100,
      clientX: 100,
      clientY: 100,
      ctrlKey: true,
    });

    expect(wheelEvent.defaultPrevented).toBe(false);
  });
});
