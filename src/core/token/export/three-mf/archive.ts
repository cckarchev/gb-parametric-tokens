import { zipSync } from "fflate";

import { PRUSA_MODEL_CONFIG_PATH } from "./prusaModelConfig";

const CONTENT_TYPES_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>' +
  "</Types>";

const RELATIONSHIPS_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>' +
  "</Relationships>";

export const buildThreeMfArchive = (
  modelXml: string,
  prusaModelConfigXml: string,
): Uint8Array => {
  const encoder = new TextEncoder();

  return zipSync({
    "[Content_Types].xml": encoder.encode(CONTENT_TYPES_XML),
    "_rels/.rels": encoder.encode(RELATIONSHIPS_XML),
    "3D/3dmodel.model": encoder.encode(modelXml),
    [PRUSA_MODEL_CONFIG_PATH]: encoder.encode(prusaModelConfigXml),
  });
};
