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

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./root.vto"),
);
const templatePromise = env.load(pageTemplatePath);

const [processedCss, processedJs, template] = await Promise.all([
  processedCssPromise,
  processedJsPromise,
  templatePromise,
]);

/**
 * Processes and returns the root component's CSS, HTML, and renderHead function.
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
  const css = cssAddSuffix(processedCss, classSuffix);
  const js = jsAddSuffix(processedJs, classSuffix);

  const html = "";

  /**
   * Renders the head section of the page.
   * @param {{ canonical: string; title?: string; pageCSS: string; headerCSS: string; footerCSS: string; }} options - Options for rendering the head.
   * @returns {Promise<string>} The rendered head section as a string.
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
      processedJs: js,
    })).content;
  };

  return {
    css,
    html,
    renderHead,
  };
};
