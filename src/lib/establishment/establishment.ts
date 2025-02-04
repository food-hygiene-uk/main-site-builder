import { type Establishment } from "../../generate-site/schema.ts";
import { slugify } from "../../generate-site/slugify.ts";

export const getHtmlFilename = (establishment: Establishment) => {
  return `/e/${
    slugify(establishment.BusinessName)
  }-${establishment.FHRSID}.html`;
};
