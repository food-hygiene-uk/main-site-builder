import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { config } from "../../lib/config/config.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

const pageTemplatePath = fromFileUrl(import.meta.resolve("./about.vto"));
const templatePromise = environment.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./about.css"),
  additionalCss: "",
});

const [template, Header, Footer, processedCss] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
  processedCssPromise,
]);

/**
 * Generates the "About" page and writes it to the output directory.
 *
 * @returns Resolves when the page has been successfully written.
 */
export const outputAboutPage = async (): Promise<void> => {
  const classSuffix = getClassSuffix();

  const pageCSS = cssAddSuffix(processedCss, classSuffix);

  const html = await template({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/`,
      title: "About",
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
  });

  const filename = "about/index.html";
  await Deno.writeTextFile(join("dist", filename), html.content);
};
