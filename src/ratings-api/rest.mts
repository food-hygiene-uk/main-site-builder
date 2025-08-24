import {
  dataSchema,
  type LocalAuthorityData,
} from "../generate-site/schema.mts";
import {
  type AuthoritiesResponse,
  authoritiesResponseSchema,
} from "./types.mts";

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

export const authorities = async (): Promise<AuthoritiesResponse> => {
  const response = await fetch(
    "https://api.ratings.food.gov.uk/authorities",
    fetchInit,
  );

  return authoritiesResponseSchema.parse(await response.json());
};

export const localAuthorityData = async (
  url: string,
): Promise<LocalAuthorityData> => {
  // It appears the redirect handler is rate limited, but the data files are not.
  // This skips the redirect handler and fetches the data directly.
  // This may break if the redirect handler is repointed elsewhere.
  const redirectedURL = url.replace(
    /^https:\/\/ratings\.food\.gov\.uk\/OpenDataFiles\//,
    "https://ratings.food.gov.uk/api/open-data-files/",
  );

  const response = await fetch(redirectedURL, fetchInit);

  if (!response.ok) {
    throw new Error(`Failed to fetch local authority data: ${response.statusText}: ${redirectedURL}`);
  }

  const jsonData = await response.json();

  try {
    return dataSchema.parse(jsonData);
  } catch (error) {
    throw new TypeError(`Invalid data format: ${redirectedURL}:\n${JSON.stringify(jsonData, null, 2)}\n${error}`);
  }
};
