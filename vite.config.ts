import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  // Lightning CSS compiles the shared @custom-media breakpoints from
  // @cckarchev/shared/breakpoints.css, which media queries need since they
  // cannot read custom properties.
  css: {
    transformer: "lightningcss",
    lightningcss: {
      cssModules: { pattern: "[local]_[hash]" },
      drafts: { customMedia: true },
    },
  },
  build: { cssMinify: "lightningcss" },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/testSetup.ts"],
    clearMocks: true,
  },
});
