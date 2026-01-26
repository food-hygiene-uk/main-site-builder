import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { Establishment } from "../../generate-site/schema.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./styles.css"),
  additionalCss: "",
});

const environment = vento();
environment.use(autoTrim());
const pageTemplatePath = fromFileUrl(import.meta.resolve("./html.vto"));
const templatePromise = environment.load(pageTemplatePath);

const [processedCss, template] = await Promise.all([
  processedCssPromise,
  templatePromise,
]);

/**
 * Extracts address information from an establishment
 *
 * @param establishment - The establishment to extract the address from
 * @returns Object containing address lines, postcode, and location link
 */
const getAddress = (
  establishment: Establishment,
): {
  lines: string[];
  postcode: string | null;
} => {
  if (establishment.Geocode !== null) {
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
    };
  }

  return {
    lines: [],
    postcode: null,
  };
};

/**
 * Creates an address component factory
 *
 * @returns Object containing the component's CSS and render function
 */
export const Address = (): {
  css: string;
  render: (
    establishment: Establishment,
  ) => Promise<ReturnType<typeof template>>;
} => {
  const classSuffix = getClassSuffix();
  const css = cssAddSuffix(processedCss, classSuffix);

  /**
   * Renders an address for the given establishment
   *
   * @param establishment - The establishment to render the address for
   * @returns Promise resolving to the rendered template
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
