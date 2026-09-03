// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SvgLoupe } from "./SvgLoupe";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M0,0 L20,0 L20,20 L0,20 Z" /></svg>';
const viewBox = { width: 20, height: 20 };

describe("SvgLoupe", () => {
  it("renders the svg content under the given aria label", () => {
    render(<SvgLoupe svg={svg} viewBox={viewBox} ariaLabel="Token preview" />);

    const container = screen.getByRole("img", { name: "Token preview" });

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("shows no lens before the mouse ever moves over it", () => {
    render(<SvgLoupe svg={svg} viewBox={viewBox} ariaLabel="Token preview" />);

    expect(screen.getByRole("img", { name: "Token preview" }).parentElement?.children).toHaveLength(
      1,
    );
  });

  it("shows a magnified lens copy of the svg while hovering, and hides it again on mouse leave", () => {
    Element.prototype.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 200 }) as DOMRect;

    render(<SvgLoupe svg={svg} viewBox={viewBox} ariaLabel="Token preview" />);

    const trackArea = screen.getByRole("img", { name: "Token preview" });

    fireEvent.mouseMove(trackArea, { clientX: 100, clientY: 100 });

    const wrapper = trackArea.parentElement;
    expect(wrapper?.querySelectorAll("svg").length).toBe(2);

    fireEvent.mouseLeave(trackArea);

    expect(wrapper?.querySelectorAll("svg").length).toBe(1);
  });

  it("zooms the lens in when scrolling up while hovering", () => {
    Element.prototype.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 200 }) as DOMRect;

    render(<SvgLoupe svg={svg} viewBox={viewBox} ariaLabel="Token preview" />);

    const trackArea = screen.getByRole("img", { name: "Token preview" });

    fireEvent.mouseMove(trackArea, { clientX: 100, clientY: 100 });
    const lensContentBefore = trackArea.parentElement?.querySelectorAll("svg")[1]
      .parentElement as HTMLElement;
    const widthBefore = Number(lensContentBefore.style.width.replace("px", ""));

    fireEvent.wheel(trackArea, { deltaY: -100 });
    const lensContentAfter = trackArea.parentElement?.querySelectorAll("svg")[1]
      .parentElement as HTMLElement;
    const widthAfter = Number(lensContentAfter.style.width.replace("px", ""));

    expect(widthAfter).toBeGreaterThan(widthBefore);
  });

  it("zooms in on scroll even without a prior mousemove, at the scrolled-over point", () => {
    Element.prototype.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 200 }) as DOMRect;

    render(<SvgLoupe svg={svg} viewBox={viewBox} ariaLabel="Token preview" />);

    const trackArea = screen.getByRole("img", { name: "Token preview" });

    fireEvent.wheel(trackArea, { deltaY: -100, clientX: 100, clientY: 100 });

    expect(trackArea.parentElement?.querySelectorAll("svg").length).toBe(2);
  });

  it("prevents the wheel event's default action, so the rest of the page does not scroll", () => {
    Element.prototype.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 200 }) as DOMRect;

    render(<SvgLoupe svg={svg} viewBox={viewBox} ariaLabel="Token preview" />);

    const trackArea = screen.getByRole("img", { name: "Token preview" });
    const wheelEvent = new window.WheelEvent("wheel", {
      deltaY: -100,
      clientX: 100,
      clientY: 100,
      bubbles: true,
      cancelable: true,
    });

    trackArea.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
  });
});
