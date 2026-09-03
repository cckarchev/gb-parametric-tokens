import { ParsedData } from "./types";

export const cleanText = (text: string) => {
  return text
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.\s*$/, "")
    .trim();
};

export const parseSpecialPlay = (raw: string | undefined) => {
  if (!raw) {
    return null;
  }

  const [nameLine, ...textParts] = raw.split("\n");
  let name = nameLine.trim();
  let extraText = "";

  const match = name.match(/\[(.*?)\]/);
  if (match) {
    extraText = `${match[1]}. `;
    name = name.replace(match[0], "").trim();
  }

  const text = extraText + textParts.join(" ").replace(/\n/g, " ").trim();

  return { name, text };
};

export const exportToTSVContent = (data: ParsedData[]): string => {
  return data.map(({ name, text }) => `${name}\t${text}`).join("\n");
};
