import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "components/root/forge.mts";
import { forgeHeader } from "components/header/forge.mts";
import { forgeFooter } from "components/footer/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { config } from "../../lib/config/config.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";
import { jsAddSuffix, processJsFile } from "../../lib/js/js.mts";

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

// Load templates and assets for main lists page
const listPageTemplatePath = fromFileUrl(import.meta.resolve("./lists.vto"));
const listPageTemplatePromise = environment.load(listPageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();

// Process CSS and JS for lists page
const processedListsPageCssPromise = processCssFile({
  path: import.meta.resolve("./lists.css"),
  additionalCss: "",
});

const processedListsPageJsPromise = processJsFile({
  path: import.meta.resolve("./lists.mjs"),
});

const [
  listPageTemplate,
  Header,
  Footer,
  processedListsPageCss,
  processedListsPageJs,
] = await Promise.all([
  listPageTemplatePromise,
  HeaderPromise,
  FooterPromise,
  processedListsPageCssPromise,
  processedListsPageJsPromise,
]);

/**
 * Generates and outputs the lists page.
 *
 * @returns Resolves when the page is written to the output directory.
 */
export const outputListsPage = async (): Promise<void> => {
  const classSuffix = getClassSuffix();

  const processedListsPageCssWithSuffix = cssAddSuffix(
    processedListsPageCss,
    classSuffix,
  );
  const processedListsPageJsWithSuffix = jsAddSuffix(
    processedListsPageJs,
    classSuffix,
  );

  // Generate the main lists page
  const listsPageHtml = await listPageTemplate({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/lists/`,
      title: "My Lists",
      pageCSS: processedListsPageCssWithSuffix,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs: processedListsPageJsWithSuffix,
  });

  // Write the main lists page
  await Deno.writeTextFile(
    join("dist", "lists", "index.html"),
    listsPageHtml.content,
  );
};
