import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { config } from "../../lib/config/config.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(import.meta.resolve("./homepage.vto"));
const templatePromise = env.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./homepage.css"),
  additionalCss: "",
});

const [template, Header, Footer, processedCss] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
  processedCssPromise,
]);

/**
 * Generates the homepage HTML and writes it to the `dist` directory.
 * @returns {Promise<void>} Resolves when the homepage has been generated.
 */
export const outputHomepagePage = async (): Promise<void> => {
  const classSuffix = getClassSuffix();

  const pageCSS = cssAddSuffix(processedCss, classSuffix);

  const html = await template({
    headHtml: await Root.renderHead({
      canonical: `${config.BASE_URL}/`,
      title: undefined,
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    footerHtml: Footer.html,
  });

  const filename = `index.html`;
  await globalThis.Deno.writeTextFile(join("dist", filename), html.content);
};
