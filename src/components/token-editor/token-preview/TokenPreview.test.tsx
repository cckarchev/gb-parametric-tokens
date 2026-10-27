// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PreviewItem } from "@/browser/tokenWorker";
import type { ColorGroupSpec, ShapeSpec } from "@/core/token/types";

import { TokenPreview } from "./TokenPreview";

const colorGroups: ColorGroupSpec[] = [
  { id: "base", name: "Body", color: "#2B2B2B" },
];

describe("TokenPreview", () => {
  it("dims the stale contact sheet while a preview is in flight", () => {
    const { container } = render(
      <TokenPreview items={[]} isPreviewing={true} colorGroups={colorGroups} />,
    );

    expect(
      container.querySelector('[class*="svgContainerLoading"]'),
    ).not.toBeNull();
  });

  it("does not dim the contact sheet once the preview has settled", () => {
    const { container } = render(
      <TokenPreview
        items={[]}
        isPreviewing={false}
        colorGroups={colorGroups}
      />,
    );

    expect(
      container.querySelector('[class*="svgContainerLoading"]'),
    ).toBeNull();
  });

  it("hides the 30mm base circle when its checkbox is cleared", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 20,
      studDiameterMm: 12,
    };
    const arcItem: PreviewItem = {
      id: "arc",
      label: "Arc",
      name: "Arc",
      copies: 1,
      shape: arcShape,
      baseContours: [],
      reliefComponents: [],
      warnings: [],
      valid: true,
      reason: "",
    };

    const { container } = render(
      <TokenPreview
        items={[arcItem]}
        isPreviewing={false}
        colorGroups={colorGroups}
      />,
    );

    const circleSelector = '[data-role="base-reference-circle"]';

    expect(container.querySelector(circleSelector)).not.toBeNull();

    fireEvent.click(screen.getByLabelText("Show 30mm base"));

    expect(container.querySelector(circleSelector)).toBeNull();
  });
});
