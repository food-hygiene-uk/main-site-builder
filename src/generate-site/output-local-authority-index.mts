import { fromFileUrl, join } from "@std/path";
import { type Establishment } from "./schema.mts";
import { getClassSuffix } from "../lib/template/template.mts";
import { forgeRoot } from "../components/root/forge.mts";
import { forgeHeader } from "../components/header/forge.mts";
import { forgeFooter } from "../components/footer/forge.mts";
import { Address } from "../components/address/forge.mts";
import { EnrichedLocalAuthority } from "./schema-app.mts";
import { getLinkURL } from "../lib/establishment/establishment.mts";
import { getCanonicalLinkURL } from "../lib/authority/authority.mts";

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
  await import.meta.resolve("./output-local-authority-index.mjs"),
);
const mjsContent = Deno.readTextFileSync(mjsPath);

export const outputLocalAuthorityIndex = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
) => {
  const classSuffix = getClassSuffix();

  const processedMjs = mjsContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const html = `
<!DOCTYPE html>
<html lang="en">
${
    Root.renderHead({
      canonical: getCanonicalLinkURL(localAuthority),
      title: `${localAuthority.Name} - Local Authority`,
      pageCSS: `
    .content-${classSuffix} {
        display: contents;

      h1 {
        font-size: 2em;
        border-bottom: 1px solid var(--hygiene-green);
      }

      h3 {
        font-size: 1em;
        font-weight: bold;
        margin-top: 0;
      }

      label[for="filter-input"] {
        display: block;
        margin-bottom: 0.5rem;
      }
      #filter-input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
      }

      .establishment {
        padding: 1rem 0;
        display: block;

        &.hidden {
          display: none;
        }

        /* Link the entire establishment to the details page */
        position: relative;

        .details-link {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          text-indent: -9999px; /* Hide the text inside the link */

          &:hover {
            display: flex;
            flex-direction: column-reverse;
            text-align: right;
            padding-right: 1rem;
            padding-bottom: 1rem;
          }
        }

        &:has(a:hover) {
          background-color: var(--background-highlight-color);
          color: var(--text-highlight-color);
          margin-left: -1rem;
          margin-right: -1rem;
          padding-left: 1rem;
          padding-right: 1rem;
          border-radius: 9px;
        }
      }

      .map-link {
        position: relative;
        z-index: 2;
      }

      hr {
        border: none;
        border-top: 1px solid var(--hygiene-green);

        /* 
          Hide by default
         */
        display: none;
      }

      /*
        Only show the hr between two visible establishments
        i.e. for establishments that are not hidden show the hr after it
        but only if that hr has another establishment after it that is not hidden
       */
      .establishment:not(.hidden) ~ hr:has(+ .establishment:not(.hidden)) {
        display: block;
      }
      
      ${address.css}
    }  
  `,
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
