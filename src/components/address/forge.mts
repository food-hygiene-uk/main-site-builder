import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { Establishment } from "../../generate-site/schema.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import postcss from "postcss";
import cssnano from "cssnano";

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

const processedCssResult = await postcss([cssnano]).process(cssContent, {
  from: undefined,
});
const processedCssContent = processedCssResult.css;

const env = vento();
env.use(autoTrim());
const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./html.vto"),
);
const template = await env.load(pageTemplatePath);

/**
 * Extracts address information from an establishment
 *
 * @param {Establishment} establishment - The establishment to extract the address from
 * @returns {Object} Object containing address lines, postcode, and location link
 */
const getAddress = (establishment: Establishment): {
  lines: string[];
  postcode: string | null;
  locationLink: string | null;
} => {
  if (establishment.Geocode !== null) {
    const businessName = encodeURIComponent(establishment.BusinessName);
    const latitude = establishment.Geocode?.Latitude;
    const longitude = establishment.Geocode?.Longitude;
    const locationLink =
      `https://geohack.toolforge.org/geohack.php?title=${businessName}&params=${latitude}_N_${longitude}_E_type:landmark_dim:20`;

    const lines = [
      establishment.AddressLine1 ?? null,
      establishment.AddressLine2 ?? null,
      establishment.AddressLine3 ?? null,
      establishment.AddressLine4 ?? null,
    ].filter((x) => x !== null);

    const postcode = establishment.PostCode ?? null;

    return {
      lines,
      postcode,
      locationLink,
    };
  }

  return {
    lines: [],
    postcode: null,
    locationLink: null,
  };
};

/**
 * Creates an address component factory
 *
 * @returns {Object} Object containing the component's CSS and render function
 */
export const Address = () => {
  const classSuffix = getClassSuffix();
  const processedCss = processedCssContent.replace(
    /__CLASS_SUFFIX__/g,
    classSuffix,
  );

  const css = processedCss;

  /**
   * Renders an address for the given establishment
   *
   * @param {Establishment} establishment - The establishment to render the address for
   * @returns {Promise<Object>} Promise resolving to the rendered template
   */
  const render = async (
    establishment: Establishment,
  ): Promise<ReturnType<typeof template>> => {
    const address = getAddress(establishment);

    return template({
      address: {
        ...address,
        classSuffix,
      },
    });
  };

  return {
    css,
    render,
  };
};
