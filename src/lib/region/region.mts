import type { APIRegion } from "../../ratings-api/types.mts";
import { slugify } from "../../generate-site/slugify.mts";
import {
  type AuthoritiesResponse,
  type Authority,
} from "../../ratings-api/types.mts";

const authoritiesResponse = await fetch(
  "https://food-hygiene-uk.github.io/data/files/api/authorities-en-GB.json",
);
if (!authoritiesResponse.ok) {
  throw new Error(
    `Fetch failed for authorities: ${authoritiesResponse.status}`,
  );
}
const authoritiesData =
  (await authoritiesResponse.json()) satisfies AuthoritiesResponse;

const authoritiesMap = new Map(
  authoritiesData.authorities.map((a: Authority) => [
    a.LocalAuthorityIdCode,
    a,
  ]),
) satisfies Map<string, Authority>;

// Map from api regions to ITL regions
const regionMap = {
  "East Counties": "East of England" as const,
  "East Midlands": "East Midlands" as const,
  London: "London" as const,
  "North East": "North East" as const,
  "North West": "North West" as const,
  "South East": "South East" as const,
  "South West": "South West" as const,
  "West Midlands": "West Midlands" as const,
  "Yorkshire and Humberside": "Yorkshire and the Humber" as const,
  "Northern Ireland": "Northern Ireland" as const,
  Scotland: "Scotland" as const,
  Wales: "Wales" as const,
} satisfies Record<APIRegion, string>;

export const regions = Object.values(regionMap);

export type ITLRegion = (typeof regionMap)[keyof typeof regionMap];

export const getITLRegionName = (apiRegion: APIRegion): ITLRegion => {
  const region = regionMap[apiRegion];

  if (!region) {
    throw new Error(`Unknown API region: ${apiRegion}`);
  }

  return region;
};

// Map from ITL regions to ITL regions stubs
const itlRegionSlugMap = {
  "East of England": "east-of-england" as const,
  "East Midlands": "east-midlands" as const,
  London: "london" as const,
  "North East": "north-east" as const,
  "North West": "north-west" as const,
  "South East": "south-east" as const,
  "South West": "south-west" as const,
  "West Midlands": "west-midlands" as const,
  "Yorkshire and the Humber": "yorkshire-and-the-humber" as const,
  "Northern Ireland": "northern-ireland" as const,
  Scotland: "scotland" as const,
  Wales: "wales" as const,
} satisfies Record<ITLRegion, string>;

export const itlRegionSlugs = Object.values(itlRegionSlugMap);

type ITLRegionSlug = (typeof itlRegionSlugMap)[keyof typeof itlRegionSlugMap];

export const getITLRegionSlug = (region: ITLRegion): ITLRegionSlug => {
  const slug = itlRegionSlugMap[region];

  if (!slug) {
    throw new Error(`Unknown ITL region: ${region}`);
  }

  return slug;
};

export const getAuthorityITLRegionSlug = (
  LocalAuthorityIdCode: string,
): ITLRegion => {
  const authority = authoritiesMap.get(LocalAuthorityIdCode);

  if (!authority) {
    throw new Error(`Unknown authority code: ${LocalAuthorityIdCode}`);
  }

  const regionNameSlug = slugify(
    getITLRegionName(authority.RegionName),
  ) as ITLRegion;

  if (!regionNameSlug) {
    throw new Error(
      `Unknown region for authority id code: ${LocalAuthorityIdCode}`,
    );
  }

  return regionNameSlug;
};
