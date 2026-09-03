import { ManifestEntry } from "../core/token/icons/iconManifest";

const MANIFEST_URL = "/icons/manifest.json";

export const loadIconManifest = async (): Promise<ManifestEntry[]> => {
  const response = await fetch(MANIFEST_URL);

  if (!response.ok) {
    throw new Error(`Failed to load icon manifest: ${response.statusText}`);
  }

  return response.json();
};
