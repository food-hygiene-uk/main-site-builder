import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { type Authorities } from "../../ratings-api/types.mts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { getLinkURL } from "../../lib/authority/authority.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import postcss from "postcss";
import cssnano from "cssnano";

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

const cssPath = fromFileUrl(
  import.meta.resolve("./local-authority-list.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

const processedCssContent = await postcss([cssnano]).process(cssContent, {
  from: undefined,
});
const processedCss = processedCssContent.css;

const [template, Header, Footer] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
]);

export const outputLocalAuthorityListPage = async (
  localAuthorities: Authorities,
) => {
  const classSuffix = getClassSuffix();

  const pageCSS = processedCss.replace(/__CLASS_SUFFIX__/g, classSuffix);

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
