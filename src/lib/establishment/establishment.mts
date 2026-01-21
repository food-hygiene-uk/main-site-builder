import { type Establishment } from "../../generate-site/schema.mts";
import { config } from "../config/config.mts";
import { encodeName } from "../file/file.mts";
import { slugify } from "../../generate-site/slugify.mts";
import { getAuthorityITLRegionSlug } from "../region/region.mts";

/**
 * Gets the HTML filename for an establishment
 *
 * @param establishment - The establishment object
 * @returns The HTML filename for the establishment
 */
export const getHtmlFilename = (establishment: Establishment): string => {
  return `${getLinkURL(establishment)}.html`;
};

/**
 * Gets the canonical URL for an establishment
 *
 * @param establishment - The establishment object
 * @returns The canonical URL for the establishment
 */
export const getCanonicalLinkURL = (establishment: Establishment): string => {
  return `${config.BASE_URL}${getLinkURL(establishment)}`;
};

/**
 * Gets the relative URL path for an establishment
 *
 * @param establishment - The establishment object
 * @returns The relative URL path for the establishment
 */
export const getLinkURL = (establishment: Establishment): string => {
  return `/region-${
    getAuthorityITLRegionSlug(
      establishment.LocalAuthorityCode,
    )
  }/${getLinkName(establishment)}`;
};

/**
 * Gets the link name segment for an establishment URL
 *
 * @param establishment - The establishment object
 * @returns The URL-friendly name segment for the establishment
 */
export const getLinkName = (establishment: Establishment): string => {
  const safeName = globalThis.encodeURI(
    encodeName(
      `${slugify(establishment.BusinessName)}-${establishment.FHRSID}`,
    ),
  );

  return safeName;
};
