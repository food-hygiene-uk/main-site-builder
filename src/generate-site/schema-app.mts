import { z } from "zod";
import { authoritiesResponseSchema } from "../ratings-api/types.mts";

const enrichedLocalAuthority = z.object({
  ...authoritiesResponseSchema.shape.authorities.element.shape,
  buildFileName: z.string(),
});

export type EnrichedLocalAuthority = z.infer<typeof enrichedLocalAuthority>;
export type EnrichedLocalAuthorities = EnrichedLocalAuthority[];
