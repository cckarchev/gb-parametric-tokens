import { promises as fs } from "fs";
import path from "path";

import { exportToTSVContent, FileExportParams } from "../src/core/playbook";

const baseOutputDir = path.join(process.cwd(), "raw-output");
const tsvDir = path.join(baseOutputDir, "tsv");

export const initializeFolders = async () => {
  await fs.mkdir(tsvDir, { recursive: true });
};

export const saveTsvData = async ({ guildName, data }: FileExportParams) => {
  const tsvPath = path.join(tsvDir, `${guildName.toLowerCase()}.tsv`);

  try {
    await fs.access(tsvPath);
    console.log(`Skipped ${tsvPath} (already exists)`);
  } catch {
    const tsvContent = exportToTSVContent(data);
    await fs.writeFile(tsvPath, tsvContent, "utf8");
    console.log(`Exported ${tsvPath}`);
  }
};
