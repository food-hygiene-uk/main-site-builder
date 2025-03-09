import { fromFileUrl, join } from "@std/path";
import { type Establishment } from "../../generate-site/schema.mts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { Address } from "../../components/address/forge.mts";
import { EnrichedLocalAuthority } from "../../generate-site/schema-app.mts";
import { getLinkURL } from "../../lib/establishment/establishment.mts";
import { getCanonicalLinkURL } from "../../lib/authority/authority.mts";

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();
const address = Address();

const renderEstablishments = (establishments: Establishment[]) => {
  return `
    <h2>Establishments</h2>
    <form>
      <label for="filter-input">Filter:</label>
      <input type="search" id="filter-input" placeholder="type a name or address" />
    </form>
    <div class="establishments-container">
    ${
    establishments.map((establishment) => `
      <div class="establishment" data-establishment-id="${establishment.FHRSID}">
        <h3>${establishment.BusinessName}</h3>
        ${address.render(establishment)}
        <a href="${getLinkURL(establishment)}" class="details-link">
          More
        </a>
      </div>
    `).join("\n<hr>\n")
  }
    </div>
  `;
};

// Read the file using the absolute path
const mjsPath = fromFileUrl(
  import.meta.resolve("./script.mjs"),
);
const mjsContent = Deno.readTextFileSync(mjsPath);

const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const outputLocalAuthorityIndex = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
) => {
  const classSuffix = getClassSuffix();

  const processedMjs = mjsContent.replace(/__CLASS_SUFFIX__/g, classSuffix);
  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix)
    .replace(/\/\* __ADDITIONAL_CSS__ \*\//g, `\n${address.css}`);

  const pageCSS = processedCss;

  const html = `
<!DOCTYPE html>
<html lang="en">
${
    Root.renderHead({
      canonical: getCanonicalLinkURL(localAuthority),
      title: `${localAuthority.Name} - Local Authority`,
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    })
  }
  <body>
    ${Header.html}
    <div class="content-${classSuffix}">
      <div class="container">
        <article class="local-authority" itemscope itemtype="https://schema.org/GovernmentOrganization">
          <h1 class="name" itemprop="name">${localAuthority.Name}</h1>
          ${renderEstablishments(establishments)}
        </article>
      </div>
    </div>
    <script type="module">
      ${processedMjs}
    </script>
    ${Footer.html}
  </body>
</html>
`;

  const filename = `${localAuthority.FriendlyName}.html`;
  await Deno.writeTextFile(join("dist", "l", filename), html);
};
