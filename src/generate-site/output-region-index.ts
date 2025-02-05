import { join } from "@std/path";
import { type Authorities } from "../ratings-api/types.ts";
import { forgeRoot } from "../components/root/forge.ts";
import { forgeHeader } from "../components/header/forge.ts";
import { forgeFooter } from "../components/footer/forge.ts";

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
      const authoritySlug = authority.Name.replace(/ /g, "-").toLowerCase();
      return `
          <a href="/l/${authoritySlug}" class="authority-link">
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

export const outputRegionIndex = async (localAuthorities: Authorities) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Regions - Food Hygiene Ratings UK</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
        ${Root.css}

        .authorities {
            background-color: white;
            position: relative;
            z-index: 2;
            padding: 3rem 1rem 4rem 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        @media (max-width: 768px) {
            .authorities {
                margin-top: -2rem;
                padding: 2rem 1rem 3rem 1rem;
            }
        }

        .authorities h2 {
            color: var(--primary-blue);
        }

        .authorities p {
            color: var(--grey);
        }

        .region-group {
            margin-top: 2rem;
            margin-top: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .region-group h3 {
            color: var(--teal);
            margin-bottom: 1rem;
        }

        .authority-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            width: 100%;
            max-width: 1200px;
        }

        .authority-link {
            background-color: var(--light-grey);
            padding: 1rem;
            border-radius: 4px;
            text-decoration: none;
            color: var(--teal);
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 2px solid transparent;
            text-align: center;
        }

        .authority-link:hover {
            transform: translateY(-2px);
            border-color: var(--teal);
            background-color: white;
        }

        ${Header.css}
        ${Footer.css}
    </style>
</head>
<body>
    ${Header.html}

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

    ${Footer.html}
</body>
</html>`;

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", "l", filename), html);
};
