import { join } from "@std/path";
import { type Authorities } from "../ratings-api/types.ts";

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
}

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
+     authorities.sort((a, b) => a.Name.localeCompare(b.Name));
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

export const outputHomepage = async (localAuthorities: Authorities) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Food Hygiene Ratings UK</title>
    <style>
        :root {
            /* Information and background colors */
            --primary-blue: #2c4c6b;
            --light-blue: #f5f7fa;
            --teal: #3c7b8e;
            --grey: #687789;
            --light-grey: #eef2f6;
            
            /* Call to action colors */
            --cta-orange: #e67e22;
            --cta-hover: #d35400;
        }
        
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: var(--light-blue);
            color: var(--primary-blue);
        }

        .hero {
            position: relative;
            height: 500px;
            background-color: var(--primary-blue);
            overflow: hidden;
        }

        .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.7;
        }

        .hero-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            width: 90%;
            max-width: 800px;
            z-index: 1;
        }

        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .hero p {
            font-size: 1.2rem;
            margin-bottom: 1rem;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            color: var(--light-blue);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .authorities {
            background-color: white;
            margin-top: -3rem;
            position: relative;
            z-index: 2;
            padding: 3rem 1rem 4rem 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

        .contribute {
            background-color: white;
            padding: 4rem 0;
            margin-top: 2rem;
            text-align: center;
            border-radius: 8px;
        }

        .contribute h2 {
            color: var(--primary-blue);
        }

        .contribute p {
            color: var(--grey);
        }

        .cta-button {
            display: inline-block;
            background-color: var(--cta-orange);
            color: white;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 4px;
            margin: 1rem;
            transition: background-color 0.3s;
            font-weight: 500;
        }

        .cta-button:hover {
            background-color: var(--cta-hover);
            transform: translateY(-1px);
        }

        footer {
            background-color: var(--primary-blue);
            color: var(--light-blue);
            padding: 2rem 0;
            text-align: center;
            margin-top: 2rem;
        }

        footer a {
            color: white;
            text-decoration: none;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            transition: border-color 0.3s;
        }

        footer a:hover {
            border-color: white;
        }

        @media (max-width: 768px) {
            .hero {
                height: 400px;
            }

            .hero h1 {
                font-size: 2rem;
            }

            .hero p {
                font-size: 1rem;
            }

            .authorities {
                margin-top: -2rem;
                padding: 2rem 1rem 3rem 1rem;
            }
        }
    </style>
</head>
<body>
    <section class="hero">
        <img src="/api/placeholder/1920/500" alt="Food hygiene ratings hero image" class="hero-image">
        <div class="hero-content">
            <h1>Food Hygiene Ratings UK</h1>
            <p>Browse food hygiene ratings by local authority</p>
        </div>
    </section>

    <section class="hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1>Food Hygiene</h1>
                <p>A responsibility in every kitchen</p>
            </div>
            <div class="hero-image-container">
                <img src="/api/placeholder/300/300" alt="Cute chef mascot with chef's hat">
            </div>
            <div class="hero-right">
                <h1>Ratings UK</h1>
                <p>Browse local establishments</p>
            </div>
        </div>
    </section>

    <main class="container">
        <section class="authorities">
            <h2>Local Authorities</h2>
            <p>Select a local authority to view ratings in that area:</p>
            <div>
                ${renderLocalAuthorities(localAuthorities)}
            </div>
        </section>

        <section class="contribute">
            <h2>Open Source Project</h2>
            <p>This is an open source project that aims to make food hygiene data more accessible.</p>
            <p>Help us improve by contributing to the project:</p>
            <div>
                <a href="https://github.com/food-hygiene-ratings-uk/food-hygiene-rating-scheme" class="cta-button">View on GitHub</a>
                <a href="https://github.com/food-hygiene-ratings-uk/food-hygiene-rating-scheme/contribute" class="cta-button">Contribute</a>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>Food Hygiene Ratings UK - Open Source Project</p>
            <p>Data provided by local authorities across the UK</p>
            <a href="https://github.com/food-hygiene-ratings-uk/food-hygiene-rating-scheme">GitHub Repository</a>
        </div>
    </footer>
</body>
</html>`;

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", filename), html);
};
