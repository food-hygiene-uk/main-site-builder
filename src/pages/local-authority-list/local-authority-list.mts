import { fromFileUrl, join } from "@std/path";
import { type Authorities } from "../../ratings-api/types.mts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { getLinkURL } from "../../lib/authority/authority.mts";
import { getClassSuffix } from "../../lib/template/template.mts";

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();

// Map from api regions to ITL regions
const regionMap = {
  "East Counties": "East of England",
  "East Midlands": "East Midlands",
  "London": "London",
  "North East": "North East",
  "North West": "North West",
  "South East": "South East",
  "South West": "South West",
  "West Midlands": "West Midlands",
  "Yorkshire and Humberside": "Yorkshire and the Humber",
  "Northern Ireland": "Northern Ireland",
  "Scotland": "Scotland",
  "Wales": "Wales",
};

const renderLocalAuthorities = (localAuthorities: Authorities) => {
  const groupedByRegion = localAuthorities.reduce((acc, authority) => {
    const region = regionMap[authority.RegionName];
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(authority);
    return acc;
  }, {} as Record<string, typeof localAuthorities>);

  return Object.keys(regionMap).map((regionKey) => {
    const region = regionMap[regionKey as keyof typeof regionMap];
    const authorities = groupedByRegion[region] || [];
    +authorities.sort((a, b) => a.Name.localeCompare(b.Name));
    const authorityLinks = authorities.map((authority) => {
      const authorityURL = getLinkURL(authority);
      return `
          <a href="${authorityURL}" class="authority-link">
            ${authority.Name}
          </a>`;
    }).join("");

    return `
        <div class="region-group">
          <h3>${region}</h3>
          <div class="authority-grid">
            ${authorityLinks}
          </div>
        </div>`;
  }).join("");
};

const cssPath = fromFileUrl(
  import.meta.resolve("./local-authority-list.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const outputLocalAuthorityListPage = async (
  localAuthorities: Authorities,
) => {
  const classSuffix = getClassSuffix();

  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const pageCSS = processedCss;

  const html = `<!DOCTYPE html>
<html lang="en">
${
    Root.renderHead({
      canonical: "/l/",
      title: "Regions",
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    })
  }
<body>
    ${Header.html}

    <div class="content-${classSuffix}">
      <section class="container">
          <section class="authorities">
              <h2>Local Authorities of the United Kingdom</h2>
              <p>View food hygiene ratings for local authorities in the UK.</p>
              <p>Select a local authority to view ratings in that area:</p>
              <div>
                  ${renderLocalAuthorities(localAuthorities)}
              </div>
          </section>
      </section>
    </div>

    ${Footer.html}
</body>
</html>`;

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", "l", filename), html);
};
