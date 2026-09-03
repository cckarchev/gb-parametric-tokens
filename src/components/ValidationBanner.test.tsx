// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MinStrokeWidthValidation } from "../core/token/validation/validateMinStrokeWidth";
import { ValidationBanner } from "./ValidationBanner";

const passingValidation: MinStrokeWidthValidation = {
  valid: true,
  areaBeforeMm2: 100,
  areaAfterErosionMm2: 95,
  featureCount: 4,
  vanishedFeatureCount: 0,
};

describe("ValidationBanner", () => {
  it("shows a checking message while validating", () => {
    render(<ValidationBanner isValidating={true} validation={undefined} warnings={[]} />);

    expect(screen.getByText("Checking printability...")).toBeInTheDocument();
  });

  it("shows the validation result once settled", () => {
    render(<ValidationBanner isValidating={false} validation={passingValidation} warnings={[]} />);

    expect(screen.getByText("Printability: OK (0 of 4 features vanished)")).toBeInTheDocument();
  });

  it("shows FAILED for an invalid validation result", () => {
    const failingValidation: MinStrokeWidthValidation = {
      ...passingValidation,
      valid: false,
      vanishedFeatureCount: 2,
    };

    render(<ValidationBanner isValidating={false} validation={failingValidation} warnings={[]} />);

    expect(screen.getByText("Printability: FAILED (2 of 4 features vanished)")).toBeInTheDocument();
  });

  it("lists each warning", () => {
    render(
      <ValidationBanner
        isValidating={false}
        validation={undefined}
        warnings={["Missing icon, using blank.svg", "Momentum icon not found"]}
      />,
    );

    expect(screen.getByText("Missing icon, using blank.svg")).toBeInTheDocument();
    expect(screen.getByText("Momentum icon not found")).toBeInTheDocument();
  });
});
