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

const env = vento();
env.use(autoTrim());
env.cache.clear();

// Load templates and assets for main lists page
const listPageTemplatePath = fromFileUrl(import.meta.resolve("./lists.vto"));
const listPageTemplatePromise = env.load(listPageTemplatePath);

// Load templates and assets for detail page
const detailPageTemplatePath = fromFileUrl(import.meta.resolve("./detail.vto"));
const detailPageTemplatePromise = env.load(detailPageTemplatePath);

// Load templates and assets for shared page
const sharedPageTemplatePath = fromFileUrl(import.meta.resolve("./shared.vto"));
const sharedPageTemplatePromise = env.load(sharedPageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

// Process CSS and JS for lists page
const processedListsPageCssPromise = processCssFile({
  path: import.meta.resolve("./lists.css"),
  additionalCss: "",
});

// Read the component CSS files
const processedEstablishmentCardCssPromise = processCssFile({
  path: import.meta.resolve(
    "../../components/establishment-card/establishment-card.css",
  ),
  additionalCss: "",
});

const processedEstablishmentListCssPromise = processCssFile({
  path: import.meta.resolve(
    "../../components/establishment-list/establishment-list.css",
  ),
  additionalCss: "",
});

const processedListsPageJsPromise = processJsFile({
  path: import.meta.resolve("./lists.mjs"),
});

// Process CSS for detail page
const processedDetailPageCssPromise = processCssFile({
  path: import.meta.resolve("./detail.css"),
  additionalCss: `
  ${address.css}
  ${await processedEstablishmentCardCssPromise}
  ${await processedEstablishmentListCssPromise}
`,
});

const processedDetailPageJsPromise = processJsFile({
  path: import.meta.resolve("./detail.mjs"),
});

// Load and process JS for shared page
const processedSharedPageJsPromise = processJsFile({
  path: import.meta.resolve("./shared.mjs"),
});

const [
  listPageTemplate,
  detailPageTemplate,
  sharedPageTemplate,
  Header,
  Footer,
  processedListsPageCss,
  processedListsPageJs,
  processedDetailPageCss,
  processedDetailPageJs,
  processedSharedPageJs,
] = await Promise.all([
  listPageTemplatePromise,
  detailPageTemplatePromise,
  sharedPageTemplatePromise,
  HeaderPromise,
  FooterPromise,
  processedListsPageCssPromise,
  processedListsPageJsPromise,
  processedDetailPageCssPromise,
  processedDetailPageJsPromise,
  processedSharedPageJsPromise,
]);

/**
 * Generates and outputs the lists pages, including the main lists page, detail page, and shared page.
 * @returns {Promise<void>} Resolves when all pages are written to the output directory.
 */
export const outputListsPages = async (): Promise<void> => {
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

  const sharedPageJs = jsAddSuffix(processedSharedPageJs, classSuffix);

  // Generate the shared page using the same CSS as the detail page
  const sharedPageHtml = await sharedPageTemplate({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/lists/shared/`,
      title: "Shared List",
      pageCSS: processedDetailPageCss, // Reuse the same CSS
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs: sharedPageJs,
  });

  // Write the main lists page
  await Deno.writeTextFile(
    join("dist", "lists", "index.html"),
    listsPageHtml.content,
  );

  // Write the detail page
  await Deno.writeTextFile(
    join("dist", "lists", "detail", "index.html"),
    detailPageHtml.content,
  );

  // Write the shared page
  await Deno.writeTextFile(
    join("dist", "lists", "shared", "index.html"),
    sharedPageHtml.content,
  );
};
