import {
  type AuthoritiesResponse,
  authoritiesResponseSchema,
} from "../ratings-api/types.mts";

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
