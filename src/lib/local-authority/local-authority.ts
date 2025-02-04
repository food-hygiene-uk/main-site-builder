import { join } from "@std/path";
import { type EnrichedLocalAuthority } from "../../generate-site/schema-app.ts";
import { dataSchema } from "../../generate-site/schema.ts";
import { type Authority } from "../../ratings-api/types.ts";

export const getBuildFileName = (localAuthority: Authority) => {
  const dataURL = localAuthority.FileName.replace(/\.xml$/, ".json");

  const match = dataURL.match(/\/([^/]*\.json)$/);
  if (!match) {
    throw new Error(`Invalid dataURL: ${dataURL}`);
  }

  return join("build", match[1]);
};

export const readLocalAuthorityData = async (
  localAuthority: EnrichedLocalAuthority,
) => {
  const filename = localAuthority.buildFileName;
  console.log(`Processing ${filename}...`);

  const module = await import(`../../../${filename}`, {
    with: { type: "json" },
  });
  let jsonData;
  try {
    jsonData = dataSchema.parse(module.default);
  } catch (error) {
    console.error("Error:", error);
    throw new Error(`Failed to parse data from ${filename}`);
  }

  return jsonData.FHRSEstablishment.EstablishmentCollection;
};
