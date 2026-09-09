// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColorGroupSpec } from "../../../core/token/types";
import { TokenPreview } from "./TokenPreview";

const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Body", color: "#2B2B2B" }];

describe("TokenPreview", () => {
  it("shows an updating message while a preview is in flight", () => {
    render(<TokenPreview items={[]} isPreviewing={true} colorGroups={colorGroups} />);

    expect(screen.getByText("Updating preview...")).toBeInTheDocument();
  });

  it("shows no status message once the preview has settled", () => {
    render(<TokenPreview items={[]} isPreviewing={false} colorGroups={colorGroups} />);

    expect(screen.queryByText("Updating preview...")).not.toBeInTheDocument();
  });

  it("dims the stale contact sheet while a preview is in flight", () => {
    const { container } = render(
      <TokenPreview items={[]} isPreviewing={true} colorGroups={colorGroups} />,
    );

    expect(container.querySelector('[class*="svgContainerLoading"]')).not.toBeNull();
  });

  it("does not dim the contact sheet once the preview has settled", () => {
    const { container } = render(
      <TokenPreview items={[]} isPreviewing={false} colorGroups={colorGroups} />,
    );

    expect(container.querySelector('[class*="svgContainerLoading"]')).toBeNull();
  });
});
