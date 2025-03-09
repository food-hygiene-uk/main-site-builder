import { fromFileUrl } from "@std/path";
import { getClassSuffix } from "../../lib/template/template.mts";

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const forgeFooter = () => {
  const classSuffix = getClassSuffix();
  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const css = processedCss;

  const html = `
        <div class="component-footer-${classSuffix}" data-suffix="${classSuffix}">
            <footer>
                <div class="container">
                    <p>Food Hygiene Ratings UK - Open Source Project</p>
                    <p>Data provided by local authorities across the UK</p>
                    <a href="https://github.com/food-hygiene-uk/main-site-builder">GitHub Repository</a>
                </div>
            </footer>
        </div>`;

  return {
    css,
    html,
  };
};
