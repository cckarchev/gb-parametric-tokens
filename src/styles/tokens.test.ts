/// <reference types="node" />
import { globSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const TOKENS_PATH = "src/styles/tokens.css";
const SHARED_TOKENS_PATH = createRequire(import.meta.url).resolve(
  "@cckarchev/shared/tokens.css",
);
const COMMENT = /\/\*[\s\S]*?\*\//g;
const MEDIA_PRELUDE = /@media[^{]+/g;
const VAR_REFERENCE = /var\((--[\w-]+)/g;
const DECLARATION = /(--[\w-]+):\s*([^;]+);/g;

// Custom properties a component declares on itself, for a value it shares
// across its own rules.
const LOCAL_PROPERTIES = new Set(["--panel-border-width"]);

// Each loose literal a stylesheet may not carry; the value belongs in
// tokens.css instead.
const FORBIDDEN_LITERALS: { name: string; pattern: RegExp }[] = [
  { name: "hex color", pattern: /#[0-9a-fA-F]{3,8}\b/ },
  { name: "rgb color", pattern: /\brgba?\(/ },
  {
    name: "length or duration",
    pattern: /(?<![\w-])-?\d*\.?\d+(px|rem|em|ch|vh|vw|ms|s)\b/,
  },
  { name: "font-weight", pattern: /font-weight:(?!\s*var\()/ },
  { name: "z-index", pattern: /z-index:(?!\s*var\()/ },
  { name: "opacity", pattern: /opacity:(?!\s*(var\(|[01];))/ },
  { name: "border-radius", pattern: /border-radius:(?!\s*var\()/ },
];

const readCss = (path: string): string =>
  readFileSync(path, "utf8").replace(COMMENT, "");

const parseTokens = (css: string): Map<string, string> => {
  const tokens = new Map<string, string>();

  for (const [, name, value] of css.matchAll(DECLARATION)) {
    tokens.set(name, value.trim());
  }

  return tokens;
};

const stylesheetPaths = globSync("src/**/*.css");
const moduleStylesheetPaths = stylesheetPaths.filter(
  (path) => path !== TOKENS_PATH,
);
const componentPaths = globSync("src/**/*.tsx", {
  exclude: (path) => path.endsWith(".test.tsx"),
});
const sharedTokens = parseTokens(readCss(SHARED_TOKENS_PATH));
const appTokens = parseTokens(readCss(TOKENS_PATH));

const isDefined = (name: string): boolean =>
  sharedTokens.has(name) || appTokens.has(name) || LOCAL_PROPERTIES.has(name);

describe("design tokens", () => {
  it("keeps corners sharp", () => {
    expect(appTokens.get("--radius-none")).toBe("0");
  });

  it("defines every token the stylesheets reference", () => {
    const missing: string[] = [];

    for (const path of stylesheetPaths) {
      for (const [, name] of readCss(path).matchAll(VAR_REFERENCE)) {
        if (!isDefined(name)) {
          missing.push(`${path}: ${name}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  // Overrides of shared tokens (the reduced-motion durations) are exempt.
  it("uses every token it adds", () => {
    const sources = [
      ...stylesheetPaths.map(readCss),
      ...componentPaths.map((path) => readFileSync(path, "utf8")),
    ];
    const used = new Set(
      sources.flatMap((source) =>
        [...source.matchAll(VAR_REFERENCE)].map(([, name]) => name),
      ),
    );
    const added = [...appTokens.keys()].filter(
      (name) => !sharedTokens.has(name),
    );
    const unused = added.filter((name) => !used.has(name));

    expect(unused).toEqual([]);
  });

  it("keeps loose literals out of every stylesheet but tokens.css", () => {
    const offenders: string[] = [];

    for (const path of moduleStylesheetPaths) {
      const lines = readCss(path).replace(MEDIA_PRELUDE, "").split("\n");

      lines.forEach((line, index) => {
        for (const { name, pattern } of FORBIDDEN_LITERALS) {
          if (pattern.test(line)) {
            offenders.push(`${path}:${index + 1} ${name}: ${line.trim()}`);
          }
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
