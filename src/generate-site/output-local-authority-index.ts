import { join } from "@std/path";
import { type Establishment } from "./schema.ts";
import { getClassSuffix } from "../lib/template/template.ts";
import { forgeRoot } from "../components/root/forge.ts";
import { forgeHeader } from "../components/header/forge.ts";
import { forgeFooter } from "../components/footer/forge.ts";
import { EnrichedLocalAuthority } from "./schema-app.ts";
import { getHtmlFilename } from "../lib/establishment/establishment.ts";

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();

const renderEstablishments = (establishments: Establishment[]) => {
  return `
    <ol>
      ${
    establishments.map((establishment) => `
        <li>
          <a href="${getHtmlFilename(establishment)}">
            ${establishment.BusinessName}
          </a>
        </li>
      `).join("")
  }
    </ol>
  `;
};

export const outputLocalAuthorityIndex = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
) => {
  const classSuffix = getClassSuffix();

  const html = `
<!DOCTYPE html>
<html lang="en">
${
    Root.renderHead({
      title: `${localAuthority.Name} - Local Authority`,
      pageCSS: `
    .content-${classSuffix} {
        display: contents;

      h1 {
          font-size: 2em;
          color: #333;
      }
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
    ${Footer.html}
  </body>
</html>
`;

  const filename = `${localAuthority.FriendlyName}.html`;
  await Deno.writeTextFile(join("dist", "l", filename), html);
};
