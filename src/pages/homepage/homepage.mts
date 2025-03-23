import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { config } from "../../lib/config/config.mts";
import { getClassSuffix } from "../../lib/template/template.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./homepage.vto"),
);
const template = await env.load(pageTemplatePath);

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();

const cssPath = fromFileUrl(
  import.meta.resolve("./homepage.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const outputHomepagePage = async () => {
  const classSuffix = getClassSuffix();

  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const pageCSS = processedCss;

  const html = await template({
    headHtml: Root.renderHead({
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
  await Deno.writeTextFile(join("dist", filename), html.content);
};
