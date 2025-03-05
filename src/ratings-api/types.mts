import { z } from "zod";

const apiRegions = [
  "East Counties",
  "East Midlands",
  "London",
  "North East",
  "North West",
  "South East",
  "South West",
  "West Midlands",
  "Yorkshire and Humberside",
  "Northern Ireland",
  "Scotland",
  "Wales",
] as const;

export const authoritiesResponseSchema = z.object({
  authorities: z.array(z.object({
    LocalAuthorityId: z.number(),
    LocalAuthorityIdCode: z.string(),
    Name: z.string(),
    FriendlyName: z.string(),
    Url: z.string(),
    SchemeUrl: z.string(),
    Email: z.string(),
    RegionName: z.enum(apiRegions),
    FileName: z.string(),
    FileNameWelsh: z.string().nullable(),
    EstablishmentCount: z.number(),
    CreationDate: z.string().datetime({ local: true }),
    LastPublishedDate: z.string().datetime({ local: true }),
    SchemeType: z.number(),
    links: z.array(
      z.object({
        rel: z.string(),
        href: z.string(),
      }),
    ),
  })),
  meta: z.object({
    dataSource: z.string(),
    extractDate: z.string(),
    itemCount: z.number(),
    returncode: z.string(),
    totalCount: z.number(),
    totalPages: z.number(),
    pageSize: z.number(),
    pageNumber: z.number(),
  }),
  links: z.array(
    z.object({
      rel: z.string(),
      href: z.string(),
    }),
  ),
});

export type AuthoritiesResponse = z.infer<typeof authoritiesResponseSchema>;
export type Authorities = AuthoritiesResponse["authorities"];
export type Authority = Authorities[number];
