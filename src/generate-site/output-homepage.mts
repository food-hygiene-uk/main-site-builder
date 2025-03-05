import { join } from "@std/path";
import { forgeRoot } from "../components/root/forge.mts";
import { forgeHeader } from "../components/header/forge.mts";
import { forgeFooter } from "../components/footer/forge.mts";
import { config } from "../lib/config/config.mts";

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();

export const outputHomepage = async () => {
  const html = `<!DOCTYPE html>
<html lang="en">
${
    Root.renderHead({
      canonical: `${config.BASE_URL}/`,
      title: undefined,
      pageCSS: `
    .hero-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.7;
        max-width: 500px;
    }
    
    .hero-image > img {
        max-width: 300px;
        max-height: 300px;
        transform: translateY(-25px);
    }

    .main-content {
        display: flex;
        justify-content: center;
        margin-top: -6rem;
        padding-top: 8rem;
        padding-bottom: 5rem;
        flex-direction: row;
        text-align: center;
        background: linear-gradient(180deg, #ffc2cb 0%, #fbe4e7 100%);
        max-width: 100%;

        @media screen and (max-width: 768px) { 
            & {
                flex-direction: column-reverse;
                align-items: center;
            }
        }
    }

    .left-side {
        text-align: left;
    }

    .contribute {
        background-color: white;
        padding: 2rem 0;
        margin-top: -3rem;
        text-align: center;
        border-radius: 8px;

        @media screen and (max-width: 768px) { 
            & {
                padding: 1rem 0;
            }
        }
    }

    .contribute h2 {
        color: var(--primary-blue);
    }

    .contribute p {
        color: var(--grey);
    }

    .cta-button {
        display: inline-block;
        background-color: var(--cta-default);
        color: white;
        padding: 1rem 2rem;
        text-decoration: none;
        border-radius: 4px;
        margin: 1rem;
        transition: background-color 0.3s;
        font-weight: 500;
    }

    .cta-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 15px rgba(0,0,0,.2);
    }
    `,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    })
  }
<body>
    ${Header.html}

    <main class="container main-content">
        <div class="description">
            <h2>Food Hygiene Ratings UK</h2>
            <p>Feeling hungry? Check to make sure your food is as hygienic as you want it to be.</p>
            <a href="/l/" class="cta-button">Browse By Region</a>
            <a href="/search/" class="cta-button">Search</a>
        </div>
        <div class="hero-image">
            <img src="/images/mascot.svg" alt="Cute chef mascot with chef's hat">
        </div>
    </main>

    <section class="container">
        <section class="contribute">
            <h2>Open Source Project</h2>
            <p>This is an open source project that aims to make food hygiene data more accessible.</p>
            <p>Help us improve by contributing to the project:</p>
            <div>
                <a href="https://github.com/food-hygiene-uk/main-site-builder" class="cta-button">View on GitHub</a>
                <a href="https://github.com/food-hygiene-uk/main-site-builder/contribute" class="cta-button">Contribute</a>
            </div>
        </section>
    </section>

    ${Footer.html}
</body>
</html>`;

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", filename), html);
};
