import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";
import { jsAddSuffix, processJsFile } from "../../lib/js/js.mts";

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./styles.css"),
  additionalCss: "",
});

const processedJsPromise = processJsFile({
  path: import.meta.resolve("./script.js"),
});

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

const pageTemplatePath = fromFileUrl(import.meta.resolve("./root.vto"));
const templatePromise = environment.load(pageTemplatePath);

const [processedCss, processedJs, template] = await Promise.all([
  processedCssPromise,
  processedJsPromise,
  templatePromise,
]);

/**
 * Processes and returns the root component's CSS, HTML, and renderHead function.
 *
 * @returns Processed CSS, HTML, and a function to render the head section
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
  const css = cssAddSuffix(processedCss, classSuffix);
  const js = jsAddSuffix(processedJs, classSuffix);

  const html = "";

  /**
   * Renders the head section of the page.
   *
   * @param options - Options for rendering the head.
   * @param options.canonical - The canonical URL of the page.
   * @param [options.title] - The title of the page.
   * @param options.pageCSS - The CSS for the page.
   * @param options.headerCSS - The CSS for the header.
   * @param options.footerCSS - The CSS for the footer.
   * @returns The rendered head section as a string.
   */
  const renderHead = async ({
    canonical,
    title,
    pageCSS,
    headerCSS,
    footerCSS,
  }: {
    canonical: string;
    title?: string;
    pageCSS: string;
    headerCSS: string;
    footerCSS: string;
  }): Promise<string> => {
    const fullTitle = [title, "Food Hygiene Ratings UK"]
      .filter(Boolean)
      .join(" - ");

    const result = await template({
      canonical,
      css,
      footerCSS,
      fullTitle,
      headerCSS,
      pageCSS,
      processedJs: js,
    });

    return result.content;
  };

  return {
    css,
    html,
    renderHead,
  };
};
