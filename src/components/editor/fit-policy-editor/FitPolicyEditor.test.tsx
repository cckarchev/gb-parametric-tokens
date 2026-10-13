// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FitPolicy } from "@/core/token/types";

import { FitPolicyEditor } from "./FitPolicyEditor";

const baseFitPolicy: FitPolicy = {
  minTracking: 0,
  maxTracking: 0.3,
  minScale: 0.7,
  allowTwoLines: true,
};

describe("FitPolicyEditor", () => {
  it("renders the current fit policy values", () => {
    render(<FitPolicyEditor fitPolicy={baseFitPolicy} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Min tracking (mm)")).toHaveValue(0);
    expect(screen.getByLabelText("Max tracking (mm)")).toHaveValue(0.3);
    expect(screen.getByLabelText("Min scale")).toHaveValue(0.7);
    expect(screen.getByLabelText("Allow two lines")).toBeChecked();
  });

  it("reports a min scale change while preserving the rest of the policy", () => {
    const onChange = vi.fn();

    render(<FitPolicyEditor fitPolicy={baseFitPolicy} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Min scale"), { target: { value: "0.5" } });

    expect(onChange).toHaveBeenCalledWith({ ...baseFitPolicy, minScale: 0.5 });
  });

  it("reports the allowTwoLines toggle", async () => {
    const onChange = vi.fn();

    render(<FitPolicyEditor fitPolicy={baseFitPolicy} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Allow two lines"));

    expect(onChange).toHaveBeenCalledWith({ ...baseFitPolicy, allowTwoLines: false });
  });
});
