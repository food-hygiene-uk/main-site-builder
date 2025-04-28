import { z } from "zod";
import { authoritiesResponseSchema } from "../ratings-api/types.mts";

export type EnrichedLocalAuthority = z.infer<
  z.ZodObject<
    {
      [
        K
          in keyof typeof authoritiesResponseSchema.shape.authorities.element.shape
      ]: (typeof authoritiesResponseSchema.shape.authorities.element.shape)[K];
    } & { buildFileName: z.ZodString }
  >
>;
export type EnrichedLocalAuthorities = EnrichedLocalAuthority[];
