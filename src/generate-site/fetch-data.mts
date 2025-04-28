import { exists } from "@std/fs";
import { type Authorities } from "../ratings-api/types.mts";
import * as api from "../ratings-api/rest.mts";
import { EnrichedLocalAuthorities } from "./schema-app.mts";
import { getBuildFileName } from "../lib/local-authority/local-authority.mts";

const USE_CACHED_DATA = false;

/**
 * Fetches and processes data for a list of local authorities.
 *
 * This function retrieves JSON data for each local authority, either by using
 * cached data if available or by fetching it from an external API. The data
 * is then saved to a file, and an enriched version of the local authority
 * object is returned with the build file name included.
 *
 * - If `USE_CACHED_DATA` is enabled and the file already exists, the function
 *   skips fetching and writing the data for that local authority.
 * - The JSON data is fetched from a URL derived from the `FileName` property
 *   of the local authority, replacing the `.xml` extension with `.json`.
 * - The generated file is saved using the `getBuildFileName` function to
 *   determine the file path.
 *
 * @param localAuthorities - An array of local authority objects to process.
 * @returns A promise that resolves to an array of enriched local authority objects,
 *          each containing the original data and the generated build file name.
 * @example
 * ```typescript
 * const localAuthorities = [
 *   { Name: "Authority1", FileName: "data1.xml" },
 *   { Name: "Authority2", FileName: "data2.xml" },
 * ];
 *
 * const enrichedData = await fetchLocalAuthorityData(localAuthorities);
 * console.log(enrichedData);
 * ```
 */
export const fetchLocalAuthorityData = async (
  localAuthorities: Authorities,
): Promise<EnrichedLocalAuthorities> => {
  return await Promise.all(
    localAuthorities.map(async (localAuthority) => {
      const jsonDataURL = localAuthority.FileName.replace(/\.xml$/, ".json");
      const filename = getBuildFileName(localAuthority);

      if (
        USE_CACHED_DATA &&
        (await exists(filename, {
          isReadable: true,
          isFile: true,
        }))
      ) {
        console.log(
          `Skipping ${localAuthority.Name} - ${filename} already exists.`,
        );
      } else {
        const jsonData = await api.localAuthorityData(jsonDataURL);
        await Deno.writeTextFile(filename, JSON.stringify(jsonData, null, 2));
      }

      return { ...localAuthority, buildFileName: filename };
    }),
  );
};
