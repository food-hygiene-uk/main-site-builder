import { z } from "zod";
import { authoritiesResponseSchema } from "../ratings-api/types.mts";

type AuthorityFromSchema = z.infer<
  typeof authoritiesResponseSchema
>["authorities"][number];

export type EnrichedLocalAuthority = AuthorityFromSchema & {
  buildFileName: string;
};
export type EnrichedLocalAuthorities = EnrichedLocalAuthority[];
