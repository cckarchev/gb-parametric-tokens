const PATH_TAG_PATTERN = /<path\b[^>]*\sd="([^"]*)"[^>]*>/g;

export const extractPathData = (svgSource: string): string[] => {
  const dAttributes: string[] = [];

  for (const match of svgSource.matchAll(PATH_TAG_PATTERN)) {
    dAttributes.push(match[1]);
  }

  return dAttributes;
};
