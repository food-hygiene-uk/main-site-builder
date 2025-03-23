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

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./local-authority-detail.vto"),
);
const template = await env.load(pageTemplatePath);

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();
const address = Address();

// Read the file using the absolute path
const mjsPath = fromFileUrl(
  import.meta.resolve("./local-authority-detail.mjs"),
);
const mjsContent = Deno.readTextFileSync(mjsPath);

const cssPath = fromFileUrl(
  import.meta.resolve("./local-authority-detail.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const outputLocalAuthorityDetailPage = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
) => {
  const classSuffix = getClassSuffix();

  const processedMjs = mjsContent.replace(/__CLASS_SUFFIX__/g, classSuffix);
  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix)
    .replace(/\/\* __ADDITIONAL_CSS__ \*\//g, `\n${address.css}`);

  const pageCSS = processedCss;

  const html = await template({
    headHtml: Root.renderHead({
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
