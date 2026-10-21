import { escapeXmlAttribute, type VolumeTriangleRange } from "./xml";

// Where PrusaSlicer looks for the parts of each object inside a 3MF archive.
export const PRUSA_MODEL_CONFIG_PATH = "Metadata/Slic3r_PE_model.config";

// Every copy is its own object, never an instance (see combinedModel.ts), so each has one.
const INSTANCES_PER_OBJECT = 1;

export type PrusaObjectConfig = {
  objectId: number;
  name: string;
  volumeRanges: VolumeTriangleRange[];
};

const buildMetadataXml = (
  type: "object" | "volume",
  key: string,
  value: string,
): string =>
  `<metadata type="${type}" key="${key}" value="${escapeXmlAttribute(value)}"/>`;

const buildVolumeXml = (range: VolumeTriangleRange): string =>
  `<volume firstid="${range.firstTriangleId}" lastid="${range.lastTriangleId}">` +
  buildMetadataXml("volume", "name", range.name) +
  `</volume>`;

// PrusaSlicer ignores a 3MF's <components>, flattening them into separate objects that it then
// offers to merge into one. This sidecar file is how its own exports keep a multi-part object:
// it splits each object's single mesh into named parts by triangle range.
export const buildPrusaModelConfigXml = (
  objects: PrusaObjectConfig[],
): string => {
  const objectsXml = objects
    .map(
      (object) =>
        `<object id="${object.objectId}" instances_count="${INSTANCES_PER_OBJECT}">` +
        buildMetadataXml("object", "name", object.name) +
        object.volumeRanges.map(buildVolumeXml).join("") +
        `</object>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><config>${objectsXml}</config>`;
};
