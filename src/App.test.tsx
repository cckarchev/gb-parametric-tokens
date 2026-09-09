// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./components/token/TokenEditor/TokenEditor", () => ({
  TokenEditor: () => <p>Token editor</p>,
}));

const { App } = await import("./App");

describe("App", () => {
  it("renders the token editor", () => {
    render(<App />);

    expect(screen.getByText("Token editor")).toBeInTheDocument();
  });
});
