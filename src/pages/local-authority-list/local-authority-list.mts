import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { type Authorities } from "../../ratings-api/types.mts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { getLinkURL } from "../../lib/authority/authority.mts";
import {
  getITLRegionName,
  ITLRegion,
  regions,
} from "../../lib/region/region.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";
import { config } from "../../lib/config/config.mts";
import { jsAddSuffix, processJsFile } from "../../lib/js/js.mts";

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./local-authority-list.vto"),
);
const templatePromise = environment.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./local-authority-list.css"),
  additionalCss: "",
});

const processedLocalAuthorityListPageJsPromise = processJsFile({
  path: import.meta.resolve("./local-authority-list.mjs"),
});

/**
 * Maps local authorities to their respective regions.
 *
 * @param localAuthorities - List of local authorities.
 * @returns Grouped and sorted local authorities by region.
 */
const getRegionLocalAuthorities = (
  localAuthorities: Authorities,
): Array<{
  region: ITLRegion;
  authorities: Authorities;
}> => {
  const groupedByRegion = {} as Record<ITLRegion, typeof localAuthorities>;
  for (const authority of localAuthorities) {
    const region = getITLRegionName(authority.RegionName);
    groupedByRegion[region] ??= [];
    groupedByRegion[region].push(authority);
  }

  return regions.map((region) => {
    // groupedByRegion is created in this function, no need to clone it
    // eslint-disable-next-line unicorn/no-array-sort
    const authorities = (groupedByRegion[region] || []).sort((a, b) =>
      a.Name.localeCompare(b.Name)
    );

    return {
      region,
      authorities,
    };
  });
};

const [
  template,
  Header,
  Footer,
  processedCss,
  processedLocalAuthorityListPageJs,
] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
  processedCssPromise,
  processedLocalAuthorityListPageJsPromise,
]);

/**
 * Outputs the local authority list page to the `dist` directory.
 *
 * @param localAuthorities - List of local authorities.
 * @returns Resolves when the page is written to disk.
 */
export const outputLocalAuthorityListPage = async (
  localAuthorities: Authorities,
) => {
  const classSuffix = getClassSuffix(true);

  const pageCSS = cssAddSuffix(processedCss, classSuffix);
  const processedLocalAuthorityListPageJsWithSuffix = jsAddSuffix(
    processedLocalAuthorityListPageJs,
    classSuffix,
  );

  const html = await template({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/l/`,
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
    processedJs: processedLocalAuthorityListPageJsWithSuffix,
  });

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", "l", filename), html.content);
};
