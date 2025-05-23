import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "components/root/forge.mts";
import { forgeHeader } from "components/header/forge.mts";
import { forgeFooter } from "components/footer/forge.mts";
import { Address } from "components/address/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";
import { jsAddSuffix, processJsFile } from "../../lib/js/js.mts";
import { config } from "../../lib/config/config.mts";

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

const pageTemplatePath = fromFileUrl(import.meta.resolve("./search.vto"));
const templatePromise = environment.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./search.css"),
  additionalCss: `\n${address.css}`,
});

const processedJsPromise = processJsFile({
  path: import.meta.resolve("./search.mjs"),
});

const [template, Header, Footer, processedCss, processedJs] = await Promise.all(
  [
    templatePromise,
    HeaderPromise,
    FooterPromise,
    processedCssPromise,
    processedJsPromise,
  ],
);

/**
 * Generates and outputs the search page HTML.
 *
 * @returns Resolves when the search page has been written to the output directory.
 */
export const outputSearchPage = async (): Promise<void> => {
  const classSuffix = getClassSuffix();

  const pageCSS = cssAddSuffix(processedCss, classSuffix);
  const pageJs = jsAddSuffix(processedJs, classSuffix);

  const html = await template({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/search/`,
      title: "Search Food Hygiene Ratings",
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs: pageJs,
  });

  // Write the main search page
  await Deno.writeTextFile(join("dist", "search", "index.html"), html.content);
};
