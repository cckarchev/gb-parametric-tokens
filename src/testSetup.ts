import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

// Only component/hook tests run in a DOM environment (happy-dom); core-logic tests run in
// plain node, where `document` does not exist and RTL's cleanup would throw.
if (typeof document !== "undefined") {
  afterEach(() => {
    cleanup();
  });
}
