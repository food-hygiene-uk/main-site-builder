import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { getClassSuffix } from "../../lib/template/template.mts";
import postcss from "postcss";
import cssnano from "cssnano";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./root.vto"),
);
const template = await env.load(pageTemplatePath);

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

const processedCssResult = await postcss([cssnano]).process(cssContent, {
  from: undefined,
});
const processedCss = processedCssResult.css;

const jsPath = fromFileUrl(
  import.meta.resolve("./script.js"),
);
const jsContent = Deno.readTextFileSync(jsPath);

/**
 * Creates a root component factory for the HTML head section
 *
 * @returns {{ css: string; html: string; renderHead: (options: { canonical: string; title?: string; pageCSS: string; headerCSS: string; footerCSS: string; }) => Promise<string>; }}
 */
export const forgeRoot = (): {
  css: string;
  html: string;
  renderHead: (options: {
    canonical: string;
    title?: string;
    pageCSS: string;
    headerCSS: string;
    footerCSS: string;
  }) => Promise<string>;
} => {
  const classSuffix = getClassSuffix();
  const finalCss = processedCss.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const css = finalCss;

  const processedJs = jsContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const html = ``;

  /**
   * Renders the HTML head section
   *
   * @param {Object} options - Options for rendering the head
   * @param {string} options.canonical - The canonical URL for the page
   * @param {string|undefined} options.title - The page title
   * @param {string} options.pageCSS - CSS for the page
   * @param {string} options.headerCSS - CSS for the header
   * @param {string} options.footerCSS - CSS for the footer
   * @returns {Promise<string>} Promise resolving to the rendered HTML
   */
  const renderHead = async (
    { canonical, title, pageCSS, headerCSS, footerCSS }: {
      canonical: string;
      title?: string;
      pageCSS: string;
      headerCSS: string;
      footerCSS: string;
    },
  ): Promise<string> => {
    const fullTitle = [title, "Food Hygiene Ratings UK"].filter(Boolean).join(
      " - ",
    );

    return (await template({
      canonical,
      css,
      footerCSS,
      fullTitle,
      headerCSS,
      pageCSS,
      processedJs,
    })).content;
  };

  return {
    css,
    html,
    renderHead,
  };
};
