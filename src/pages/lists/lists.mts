import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { config } from "../../lib/config/config.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

// Load templates and assets for main lists page
const listPageTemplatePath = fromFileUrl(import.meta.resolve("./lists.vto"));
const listPageTemplatePromise = env.load(listPageTemplatePath);

// Load templates and assets for detail page
const detailPageTemplatePath = fromFileUrl(import.meta.resolve("./detail.vto"));
const detailPageTemplatePromise = env.load(detailPageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();

// Load CSS and JS for lists page
const listsPageCssPath = fromFileUrl(import.meta.resolve("./lists.css"));
const listsPageCssContent = Deno.readTextFileSync(listsPageCssPath);

const listsPageJsPath = fromFileUrl(import.meta.resolve("./lists.mjs"));
const listsPageJsContent = Deno.readTextFileSync(listsPageJsPath);

// Load CSS and JS for detail page
const detailPageCssPath = fromFileUrl(import.meta.resolve("./detail.css"));
const detailPageCssContent = Deno.readTextFileSync(detailPageCssPath);

const detailPageJsPath = fromFileUrl(import.meta.resolve("./detail.mjs"));
const detailPageJsContent = Deno.readTextFileSync(detailPageJsPath);

const [listPageTemplate, detailPageTemplate, Header, Footer] = await Promise
  .all([
    listPageTemplatePromise,
    detailPageTemplatePromise,
    HeaderPromise,
    FooterPromise,
  ]);

export const outputListsPages = async () => {
  const classSuffix = getClassSuffix();

  // Process CSS and JS for lists page
  const processedListsPageCss = listsPageCssContent.replace(
    /__CLASS_SUFFIX__/g,
    classSuffix,
  );
  const processedListsPageJs = listsPageJsContent.replace(
    /__CLASS_SUFFIX__/g,
    classSuffix,
  );

  // Process CSS and JS for detail page
  const processedDetailPageCss = detailPageCssContent.replace(
    /__CLASS_SUFFIX__/g,
    classSuffix,
  );
  const processedDetailPageJs = detailPageJsContent.replace(
    /__CLASS_SUFFIX__/g,
    classSuffix,
  );

  // Generate the main lists page
  const listsPageHtml = await listPageTemplate({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/lists/`,
      title: "My Lists",
      pageCSS: processedListsPageCss,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs: processedListsPageJs,
  });

  // Generate the detail page (a single page that handles all list types via URL parameters)
  const detailPageHtml = await detailPageTemplate({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/lists/detail/`,
      title: "List Details",
      pageCSS: processedDetailPageCss,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs: processedDetailPageJs,
  });

  // Create directories if they don't exist
  await Deno.mkdir(join("dist", "lists"), { recursive: true });
  await Deno.mkdir(join("dist", "lists", "detail"), { recursive: true });

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
};
