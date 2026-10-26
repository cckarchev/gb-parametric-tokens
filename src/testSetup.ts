import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

// Only component/hook tests run in a DOM environment (happy-dom); core-logic
// tests run in plain node, where `document` does not exist and RTL's cleanup
// would throw.
if (typeof document !== "undefined") {
  afterEach(() => {
    cleanup();

    // Picking a guild pushes /guild/<id> onto the history, and the URL decides
    // the starting guild, so every test has to begin back at the root or it
    // inherits the last one's guild.
    window.history.replaceState(null, "", "/");
  });
}
