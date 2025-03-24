import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { Address } from "../../components/address/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./search.vto"),
);
const templatePromise = env.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

const [template, Header, Footer] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
]);

export const outputSearchPage = async () => {
  const classSuffix = getClassSuffix();

  // Read the CSS and JS files
  const cssPath = fromFileUrl(import.meta.resolve("./search.css"));
  const cssContent = Deno.readTextFileSync(cssPath);

  const jsPath = fromFileUrl(import.meta.resolve("./search.mjs"));
  const jsContent = Deno.readTextFileSync(jsPath);

  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix)
    .replace(/\/\* __ADDITIONAL_CSS__ \*\//g, `\n${address.css}`);

  const pageCSS = processedCss;
  const processedJs = jsContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const html = await template({
    headHtml: await Root.renderHead({
      canonical: "https://food-hygiene-ratings.uk/search",
      title: "Search Food Hygiene Ratings",
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
    processedJs,
  });

  // Write the main search page
  await Deno.writeTextFile(join("dist", "search", "index.html"), html.content);
};
