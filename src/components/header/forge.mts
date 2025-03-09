import { fromFileUrl } from "@std/path";
import { getClassSuffix } from "../../lib/template/template.mts";

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const forgeHeader = () => {
  const classSuffix = getClassSuffix();
  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const css = processedCss;

  const html = `
        <div class="component-header-${classSuffix}" data-suffix="${classSuffix}">
            <header class="container">
                <nav class="navbar-${classSuffix}">
                    <div class="logo-${classSuffix}">
                        <a href="/">
                            <img src="/images/logo.svg" alt="Site Logo">
                        </a>
                    </div>
                    <ul class="nav-links-${classSuffix}">
                        <li><a href="/about/">About</a></li>
                        <li><a href="/l/">Regions</a></li>
                        <li><a href="/search/">Search</a></li>
                    </ul>
                </nav>
            </header>
        </div>`;

  return {
    css,
    html,
  };
};
