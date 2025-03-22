import { fromFileUrl, join } from "@std/path";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { config } from "../../lib/config/config.mts";
import { getClassSuffix } from "../../lib/template/template.mts";

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

  const html = `<!DOCTYPE html>
<html lang="en">
${
    Root.renderHead({
      canonical: `${config.BASE_URL}/`,
      title: undefined,
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    })
  }
<body>
    ${Header.html}

    <div class="content-${classSuffix}">
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
    </div>

    ${Footer.html}
</body>
</html>`;

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", filename), html);
};
