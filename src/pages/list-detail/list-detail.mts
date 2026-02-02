import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "components/root/forge.mts";
import { forgeHeader } from "components/header/forge.mts";
import { forgeFooter } from "components/footer/forge.mts";
import { Address } from "components/address/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { config } from "../../lib/config/config.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";
import { jsAddSuffix, processJsFile } from "../../lib/js/js.mts";

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

// Load templates and assets for detail page
const detailPageTemplatePath = fromFileUrl(
  import.meta.resolve("./list-detail.vto"),
);
const detailPageTemplatePromise = environment.load(detailPageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

// Process CSS for detail page
const processedDetailPageCssPromise = processCssFile({
  path: import.meta.resolve("./list-detail.css"),
  additionalCss: `\n${address.css}`,
});

const processedDetailPageJsPromise = processJsFile({
  path: import.meta.resolve("./list-detail.mjs"),
});

const [
  detailPageTemplate,
  Header,
  Footer,
  processedDetailPageCss,
  processedDetailPageJs,
] = await Promise.all([
  detailPageTemplatePromise,
  HeaderPromise,
  FooterPromise,
  processedDetailPageCssPromise,
  processedDetailPageJsPromise,
]);

/**
 * Generates and outputs the lists detail page.
 *
 * @returns Resolves when the page is written to the output directory.
 */
export const outputListDetailPage = async (): Promise<void> => {
  const classSuffix = getClassSuffix(true);

  // Process JS for detail page
  const detailPageJs = jsAddSuffix(processedDetailPageJs, classSuffix);
  const detailPageCss = cssAddSuffix(processedDetailPageCss, classSuffix);

  // Generate the detail page (a single page that handles all list types via URL parameters)
  const detailPageHtml = await detailPageTemplate({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/lists/detail/`,
      title: "List Details",
      pageCSS: detailPageCss,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs: detailPageJs,
  });

  // Write the detail page
  await Deno.writeTextFile(
    join("dist", "lists", "detail", "index.html"),
    detailPageHtml.content,
  );
};
