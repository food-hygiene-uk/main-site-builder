import { type AuthoritiesResponse, authoritiesResponseSchema } from "./types.ts";

const fetchInit = {
  "headers": {
    "accept": "application/json",
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
  "referrer": "https://ratings.food.gov.uk/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "omit",
} satisfies RequestInit;

export const authorities = async (): Promise<AuthoritiesResponse> => {
  return authoritiesResponseSchema.parse(await (await fetch("https://api.ratings.food.gov.uk/authorities", fetchInit))
    .json());
};
