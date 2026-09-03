import { mkdirSync, writeFileSync } from "fs";
import path from "path";

import { IconBbox, IconKind, ManifestEntry } from "../src/core/token/icons/iconManifest";
import { extractPathData } from "../src/core/token/svg/extractPathData";
import { flattenPath } from "../src/core/token/svg/flattenPath";
import { parsePathData } from "../src/core/token/svg/parsePathData";
import { Vec2 } from "../src/core/token/types";

const ICONS_API_URL =
  "https://api.github.com/repos/cleech/GBPlaybook/contents/src/components/icons?ref=pwa";
const GUILD_DATA_URL =
  "https://raw.githubusercontent.com/cleech/GBPlaybook/refs/heads/pwa/public/data/GB-Playbook-4-8.json";
const OUTPUT_DIR = path.join(process.cwd(), "public/icons");

// Files in that directory that aren't a gbicon usable on a token (app UI chrome, templates, scripts).
const EXCLUDED_FILE_NAMES = new Set(["template.tsx", "doit.sh", "active.tsx"]);

// Guild Ball status conditions. Not derivable from the GBPlaybook guild list, so hand-kept.
const STATUS_ICON_IDS = new Set([
  "bandage",
  "bleeding",
  "burning",
  "disease",
  "knock-down",
  "poison",
  "skull",
  "snared",
]);

const EM_BOX_SIZE = 16;
const PADDING_RATIO = 0.04;
const BBOX_FLATTEN_TOLERANCE = 0.01;

type GitHubContentEntry = { name: string; download_url: string };

const listIconSources = async (): Promise<GitHubContentEntry[]> => {
  const response = await fetch(ICONS_API_URL);

  if (!response.ok) {
    throw new Error(`Failed to list icon sources: ${response.statusText}`);
  }

  const entries: GitHubContentEntry[] = await response.json();

  return entries.filter(
    (entry) => entry.name.endsWith(".tsx") && !EXCLUDED_FILE_NAMES.has(entry.name),
  );
};

const fetchGuildNames = async (): Promise<string[]> => {
  const response = await fetch(GUILD_DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch guild data: ${response.statusText}`);
  }

  const data = await response.json();

  return data.Guilds.map((guild: { name: string }) => guild.name);
};

const classifyIconKind = (id: string, guildNames: string[]): IconKind => {
  if (guildNames.includes(id)) {
    return "guild";
  }

  if (STATUS_ICON_IDS.has(id)) {
    return "status";
  }

  return "generic";
};

const computeBbox = (contours: Vec2[][]): IconBbox => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const contour of contours) {
    for (const [x, y] of contour) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { minX, minY, maxX, maxY };
};

const buildSquarePaddedViewBox = (bbox: IconBbox): { x: number; y: number; size: number } => {
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;
  const centerX = (bbox.minX + bbox.maxX) / 2;
  const centerY = (bbox.minY + bbox.maxY) / 2;
  const contentSize = Math.max(width, height);
  const paddedSize = contentSize * (1 + PADDING_RATIO * 2);

  return { x: centerX - paddedSize / 2, y: centerY - paddedSize / 2, size: paddedSize };
};

const extractOneIcon = async (
  entry: GitHubContentEntry,
  guildNames: string[],
): Promise<ManifestEntry> => {
  const id = entry.name.replace(/\.tsx$/, "");
  const response = await fetch(entry.download_url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${entry.name}: ${response.statusText}`);
  }

  const svgSource = await response.text();
  const pathDataList = extractPathData(svgSource);

  if (pathDataList.length === 0) {
    throw new Error(`No <path> elements found for icon "${id}"`);
  }

  const contours = pathDataList.flatMap((d) =>
    flattenPath(parsePathData(d), BBOX_FLATTEN_TOLERANCE),
  );
  const bbox = computeBbox(contours);
  const viewBox = buildSquarePaddedViewBox(bbox);
  const pathsXml = pathDataList.map((d) => `<path d="${d}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.size} ${viewBox.size}">${pathsXml}</svg>\n`;

  writeFileSync(path.join(OUTPUT_DIR, `${id}.svg`), svg);

  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;

  return {
    id,
    kind: classifyIconKind(id, guildNames),
    pathCount: pathDataList.length,
    bbox,
    aspect: width / height,
    needsUnion: pathDataList.length > 1,
    overflowsEmBox: width > EM_BOX_SIZE || height > EM_BOX_SIZE,
  };
};

const main = async (): Promise<void> => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const [iconSources, guildNames] = await Promise.all([listIconSources(), fetchGuildNames()]);
  const manifestEntries: ManifestEntry[] = [];

  for (const source of iconSources) {
    const entry = await extractOneIcon(source, guildNames);

    manifestEntries.push(entry);
    console.log(
      `${entry.id} (${entry.kind}, ${entry.pathCount} path${entry.pathCount > 1 ? "s" : ""}` +
        `${entry.overflowsEmBox ? ", overflows em box" : ""})`,
    );
  }

  writeFileSync(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifestEntries, null, 2));

  const extractedIds = new Set(manifestEntries.map((entry) => entry.id));
  const missingGuilds = guildNames.filter((name) => !extractedIds.has(name));
  const extraGuildLikeIcons = manifestEntries.filter(
    (entry) => entry.kind === "guild" && !guildNames.includes(entry.id),
  );

  console.log(`\nExtracted ${manifestEntries.length} icons to ${OUTPUT_DIR}`);
  console.log(`Guilds: ${guildNames.length} expected, ${missingGuilds.length} missing.`);

  if (missingGuilds.length > 0) {
    console.log(`Missing guild icons: ${missingGuilds.join(", ")}`);
  }

  if (extraGuildLikeIcons.length > 0) {
    console.log(
      `Unexpected guild-tagged icons: ${extraGuildLikeIcons.map((e) => e.id).join(", ")}`,
    );
  }
};

main();
