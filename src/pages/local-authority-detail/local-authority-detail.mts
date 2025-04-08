import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { type Establishment } from "../../generate-site/schema.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { Address } from "../../components/address/forge.mts";
import { EnrichedLocalAuthority } from "../../generate-site/schema-app.mts";
import { getLinkURL } from "../../lib/establishment/establishment.mts";
import { getCanonicalLinkURL } from "../../lib/authority/authority.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";
import { jsAddSuffix, processJsFile } from "../../lib/js/js.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./local-authority-detail.vto"),
);
const templatePromise = env.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./local-authority-detail.css"),
  additionalCss: `\n${address.css}`,
});

const processedJsPromise = processJsFile({
  path: import.meta.resolve("./local-authority-detail.mjs"),
});

const [template, Header, Footer, processedCss, processedJs] = await Promise.all(
  [
    templatePromise,
    HeaderPromise,
    FooterPromise,
    processedCssPromise,
    processedJsPromise,
  ],
);

/**
 * Generates the Local Authority Detail page.
 * @param {EnrichedLocalAuthority} localAuthority - The enriched local authority data.
 * @param {Establishment[]} establishments - The list of establishments.
 * @returns {Promise<void>} A promise that resolves when the page is generated.
 */
export const outputLocalAuthorityDetailPage = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
) => {
  const classSuffix = getClassSuffix();

  const pageCSS = cssAddSuffix(processedCss, classSuffix);
  const processedMjs = jsAddSuffix(processedJs, classSuffix);

  const html = await template({
    headHtml: await Root.renderHead({
      canonical: getCanonicalLinkURL(localAuthority),
      title: `${localAuthority.Name} - Local Authority`,
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    }),
    headerHtml: Header.html,
    classSuffix,
    localAuthority,
    getLinkURL,
    address,
    establishments,
    processedMjs,
    footerHtml: Footer.html,
  });

  const filename = `${localAuthority.FriendlyName}.html`;
  await Deno.writeTextFile(join("dist", "l", filename), html.content);
};
