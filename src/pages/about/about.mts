import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import postcss from "postcss";
import cssnano from "cssnano";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { config } from "../../lib/config/config.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./about.vto"),
);
const templatePromise = env.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();

const cssPath = fromFileUrl(
  import.meta.resolve("./about.css"),
);
const rawCssContent = Deno.readTextFileSync(cssPath);

const processedCss = await postcss([cssnano]).process(rawCssContent, {
  from: undefined,
});
const cssContent = processedCss.css;

const [template, Header, Footer] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
]);

export const outputAboutPage = async () => {
  const classSuffix = getClassSuffix();

  const pageCSS = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

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
