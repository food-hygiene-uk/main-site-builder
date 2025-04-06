import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { type Authorities } from "../../ratings-api/types.mts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { getLinkURL } from "../../lib/authority/authority.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./local-authority-list.vto"),
);
const templatePromise = env.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./local-authority-list.css"),
  additionalCss: "",
});

// Map from api regions to ITL regions
const regionMap = {
  "East Counties": "East of England",
  "East Midlands": "East Midlands",
  "London": "London",
  "North East": "North East",
  "North West": "North West",
  "South East": "South East",
  "South West": "South West",
  "West Midlands": "West Midlands",
  "Yorkshire and Humberside": "Yorkshire and the Humber",
  "Northern Ireland": "Northern Ireland",
  "Scotland": "Scotland",
  "Wales": "Wales",
};

/**
 * Maps local authorities to their respective regions.
 * @param {Authorities} localAuthorities - List of local authorities.
 * @returns {Array<{ region: string; authorities: Authorities }>} Grouped and sorted local authorities by region.
 */
const getRegionLocalAuthorities = (localAuthorities: Authorities) => {
  const groupedByRegion = localAuthorities.reduce((acc, authority) => {
    const region = regionMap[authority.RegionName] || "Unknown Region";
    acc[region] ??= [];
    acc[region].push(authority);
    return acc;
  }, {} as Record<string, typeof localAuthorities>);

  return Object.values(regionMap).map((region) => {
    const authorities = groupedByRegion[region] || [];

    return {
      region,
      authorities: authorities.sort((a, b) => a.Name.localeCompare(b.Name)),
    };
  });
};

const [template, Header, Footer, processedCss] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
  processedCssPromise,
]);

/**
 * Outputs the local authority list page to the `dist` directory.
 * @param {Authorities} localAuthorities - List of local authorities.
 * @returns {Promise<void>} Resolves when the page is written to disk.
 */
export const outputLocalAuthorityListPage = async (
  localAuthorities: Authorities,
) => {
  const classSuffix = getClassSuffix();

  const pageCSS = cssAddSuffix(processedCss, classSuffix);

  const html = await template({
    headHtml: await Root.renderHead({
      canonical: "/l/",
      title: "Regions",
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    regionLocalAuthorities: getRegionLocalAuthorities(localAuthorities),
    getLinkURL,
  });

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", "l", filename), html.content);
};
