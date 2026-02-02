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

// Load templates and assets for shared page
const listSharedPageTemplatePath = fromFileUrl(
  import.meta.resolve("./list-shared.vto"),
);
const listSharedPageTemplatePromise = environment.load(
  listSharedPageTemplatePath,
);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

// Process CSS
const processedListSharedPageCssPromise = processCssFile({
  path: import.meta.resolve("./list-shared.css"),
  additionalCss: `\n${address.css}`,
});

// Process JS
const processedListSharedPageJsPromise = processJsFile({
  path: import.meta.resolve("./list-shared.mjs"),
});

const [
  sharedPageTemplate,
  Header,
  Footer,
  processedListSharedPageCss,
  processedListSharedPageJs,
] = await Promise.all([
  listSharedPageTemplatePromise,
  HeaderPromise,
  FooterPromise,
  processedListSharedPageCssPromise,
  processedListSharedPageJsPromise,
]);

/**
 * Generates and outputs the list shared page.
 *
 * @returns Resolves when the page is written to the output directory.
 */
export const outputListSharedPage = async (): Promise<void> => {
  const classSuffix = getClassSuffix(true);

  const sharedPageJs = jsAddSuffix(processedListSharedPageJs, classSuffix);
  const listSharedPageCss = cssAddSuffix(
    processedListSharedPageCss,
    classSuffix,
  );

  // Generate the shared page using the same CSS as the detail page
  const listSharedPageHtml = await sharedPageTemplate({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/lists/shared/`,
      title: "Shared List",
      pageCSS: listSharedPageCss,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs: sharedPageJs,
  });

  // Write the shared page
  await Deno.writeTextFile(
    join("dist", "lists", "shared", "index.html"),
    listSharedPageHtml.content,
  );
};
