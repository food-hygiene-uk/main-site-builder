import { type Establishment } from "../../generate-site/schema.mts";
import { config } from "../config/config.mts";
import { encodeName } from "../file/file.mts";
import { slugify } from "../../generate-site/slugify.mts";

export const getHtmlFilename = (establishment: Establishment) => {
  return `${getLinkURL(establishment)}.html`;
};

export const getCanonicalLinkURL = (establishment: Establishment) => {
  return `${config.BASE_URL}${getLinkURL(establishment)}`;
};

export const getLinkURL = (establishment: Establishment) => {
  return `/e/${getLinkName(establishment)}`;
};

export const getLinkName = (establishment: Establishment) => {
  const safeName = globalThis.encodeURI(encodeName(
    `${slugify(establishment.BusinessName)}-${establishment.FHRSID}`,
  ));

  return safeName;
};
