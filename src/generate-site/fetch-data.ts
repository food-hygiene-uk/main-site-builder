import { join } from "@std/path";
import { exists } from "@std/fs";

const USE_CACHED_DATA = true;
const RATINGS_URL = "https://ratings.food.gov.uk/";

/**
 * Fetches the URLs of local authority data in JSON format.
 *
 * This function makes a request to the RATINGS_URL to retrieve the open data page,
 * parses the response to extract XML links, and then converts those links to JSON links.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of JSON URLs.
 *
 * @throws {Error} If there is an issue fetching the data.
 */
export const fetchLocalAuthorityDataURLs = async (): Promise<string[]> => {
  const response = await fetch(`${RATINGS_URL}open-data`);
  const text = await response.text();
  const xmlLinks = Array.from(
    text.matchAll(/href="([^"]+\.xml)"/g),
    (matches) => matches[1],
  );
  const jsonLinks = xmlLinks.map((link) =>
    `${RATINGS_URL}${link.replace(".xml", ".json")}`
  );

  return jsonLinks;
};

/**
 * Fetches local authority data from a list of URLs and saves the data to the local filesystem.
 *
 * This function retrieves a list of URLs pointing to local authority data, fetches the data from each URL,
 * and saves it as a JSON file in the "build" directory. If the `USE_CACHED_DATA` flag is set to `true`,
 * the function will skip downloading and saving the data if the file already exists and is readable.
 *
 * @returns {Promise<void>} A promise that resolves when all data has been fetched and saved.
 *
 * @throws {Error} If there is an issue fetching the data or writing the files.
 */
export const fetchLocalAuthorityData = async (): Promise<string[]> => {
  const localAuthorityDataFiles: string[] = [];
  const localAuthorityDataURLs = await fetchLocalAuthorityDataURLs();

  await Promise.all(localAuthorityDataURLs.map(async (dataURL) => {
    const filename = join(
      "build",
      dataURL.split("/").pop() ?? "invalid-data-url.json",
    );

    localAuthorityDataFiles.push(filename);

    if (
      USE_CACHED_DATA && await exists(filename, {
        isReadable: true,
        isFile: true,
      })
    ) {
      console.log(`Skipping ${filename} as it already exists.`);
      return;
    }

    const response = await fetch(dataURL);
    const jsonData = await response.json();
    await Deno.writeTextFile(filename, JSON.stringify(jsonData, null, 2));
  }));

  return localAuthorityDataFiles;
};
