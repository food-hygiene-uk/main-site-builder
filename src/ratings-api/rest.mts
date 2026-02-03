import {
  dataSchema,
  type LocalAuthorityData,
} from "../generate-site/schema.mts";
import {
  type AuthoritiesResponse,
  authoritiesResponseSchema,
} from "./types.mts";

/**
 * Default fetch initialization options for API requests.
 */
const fetchInit = {
  headers: {
    accept: "application/json",
    "accept-language": "",
    "sec-ch-ua":
      '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sec-gpc": "1",
    "x-api-version": "2",
  },
  referrer: "https://ratings.food.gov.uk/",
  referrerPolicy: "strict-origin-when-cross-origin",
  body: null,
  method: "GET",
  mode: "cors",
  credentials: "omit",
} satisfies RequestInit;

/**
 * Fetches the list of local authorities from the Food Standards Agency API.
 *
 * @returns A promise resolving to the authorities response.
 */
export const authorities = async (): Promise<AuthoritiesResponse> => {
  const response = await fetch(
    "https://api.ratings.food.gov.uk/authorities",
    fetchInit,
  );

  const responseJson = await response.json();

  try {
    if (!response.ok) {
      throw new Error(
        `Failed to fetch authorities: ${response.statusText}:\n${
          JSON.stringify(responseJson, null, 2)
        }`,
      );
    }

    return authoritiesResponseSchema.parse(responseJson);
  } catch (error) {
    console.error({responseJson});
    throw error;
  }
};

/**
 * Fetches local authority data from the specified URL.
 *
 * @param url - The URL to fetch data from.
 * @returns A promise resolving to the local authority data.
 * @throws {Error} If the fetch response is not ok.
 * @throws {TypeError} If the data format is invalid.
 */
const fetchLocalAuthorityData = async (
  url: string,
): Promise<LocalAuthorityData> => {
  const redirectedURL = url.replace(
    /^https:\/\/ratings\.food\.gov\.uk\/OpenDataFiles\//,
    "https://ratings.food.gov.uk/api/open-data-files/",
  );

  const response = await fetch(redirectedURL, fetchInit);

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

/**
 * Creates a throttled function for fetching local authority data with a specified interval between requests.
 *
 * @param intervalMs - The interval in milliseconds between requests.
 * @returns A function that takes a URL and returns a promise of LocalAuthorityData.
 */
export const createThrottledLocalAuthorityData = (intervalMs = 200) => {
  type QueueItem = {
    url: string;
    resolve: (v: LocalAuthorityData) => void;
    reject: (error: unknown) => void;
  };

  const queue: QueueItem[] = [];
  let running = false;

  const processNext = () => {
    if (queue.length === 0) {
      running = false;
      return;
    }

    running = true;
    const item = queue.shift()!;
    void fetchLocalAuthorityData(item.url)
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        setTimeout(processNext, intervalMs);
      });
  };

  return (url: string): Promise<LocalAuthorityData> =>
    new Promise((resolve, reject) => {
      queue.push({ url, resolve, reject });
      if (!running) processNext();
    });
};

/**
 * A throttled function instance for fetching local authority data with a 250ms interval between requests.
 */
export const localAuthorityData = createThrottledLocalAuthorityData(250);
