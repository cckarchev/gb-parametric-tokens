import aoeTemplatesData from "@/data/aoeTemplates.json";

import { CatalogAoeTemplate } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";

const aoeTemplatesLookup = buildLookup<CatalogAoeTemplate>(
  aoeTemplatesData,
  (template) => template.id,
);

export const resolveAoeTemplate = (templateId: string): CatalogAoeTemplate => {
  return resolveById(aoeTemplatesLookup, templateId, "AOE template");
};
