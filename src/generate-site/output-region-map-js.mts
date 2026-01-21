import { EnrichedLocalAuthorities } from "./schema-app.mts";
import { getAuthorityITLRegionSlug } from "../lib/region/region.mts";

export const outputRegionMapJS = async (
  localAuthorities: EnrichedLocalAuthorities,
) => {
  const regionMap: Record<string, string> = {};

  for (const authority of localAuthorities) {
    const itlRegionSlug = getAuthorityITLRegionSlug(
      authority.LocalAuthorityIdCode,
    );

    regionMap[authority.LocalAuthorityIdCode] = itlRegionSlug;
  }

  const fileContent = `/* This is a generated file. Do not edit directly. */
export const lacToRegionSlug = ${JSON.stringify(regionMap, null, 2)};
`;

  await Deno.writeTextFile("./dist/scripts/region.mjs", fileContent);
};
