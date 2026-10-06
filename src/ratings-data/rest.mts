import { dataSchema, LocalAuthorityData } from "../generate-site/schema.mts";
import {
  type AuthoritiesResponse,
  authoritiesResponseSchema,
} from "./types.mts";

export const authorities = async (): Promise<AuthoritiesResponse> => {
  const response = await fetch(
    "https://food-hygiene-uk.github.io/data/files/api/authorities-en-GB.json",
  );
  if (!response.ok) {
    throw new Error(`Fetch failed for authorities: ${response.status}`);
  }

  const responseJson = await response.json();

  return authoritiesResponseSchema.parse(responseJson);
};

/**
 * Fetches local authority data from the specified URL.
 *
 * @param url - The URL to fetch data from.
 * @returns A promise resolving to the local authority data.
 * @throws {Error} If the fetch response is not ok.
 * @throws {TypeError} If the data format is invalid.
 */
export const fetchLocalAuthorityData = async (
  url: string,
): Promise<LocalAuthorityData> => {
  const redirectedURL = url.replace(
    /^https:\/\/ratings\.food\.gov\.uk\/OpenDataFiles\//,
    "https://food-hygiene-uk.github.io/data/files/open-data-files/",
  );

  const response = await fetch(redirectedURL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch local authority data: ${response.statusText}: ${redirectedURL}`,
    );
  }

  const jsonData = await response.json();

  try {
    return dataSchema.parse(jsonData);
  } catch (error) {
    throw new TypeError(
      `Invalid data format: ${redirectedURL}:\n${
        JSON.stringify(
          jsonData,
          null,
          2,
        )
      }\n${error}`,
    );
  }
};
