import { exists } from "@std/fs";
import { type Authorities } from "../ratings-api/types.mts";
import * as api from "../ratings-api/rest.mts";
import { EnrichedLocalAuthorities } from "./schema-app.mts";
import { getBuildFileName } from "../lib/local-authority/local-authority.mts";

const USE_CACHED_DATA = false;

/**
 * Fetches data for a list of local authorities and saves it to JSON files.
 *
 * @param {Authorities} localAuthorities - An array of local authority objects containing file information.
 * @returns {Promise<string[]>} - A promise that resolves to an array of filenames where the data is saved.
 *
 * This function performs the following steps:
 * 1. Iterates over the provided local authorities.
 * 2. Converts the XML file URL to a JSON file URL.
 * 3. Constructs the filename for saving the JSON data.
 * 4. Checks if the file already exists and is readable, and skips fetching if the cached data is used.
 * 5. Fetches the data from the URL and saves it as a JSON file.
 *
 * The function uses `Promise.all` to handle multiple asynchronous fetch operations concurrently.
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
