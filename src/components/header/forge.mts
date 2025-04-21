import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./styles.css"),
  additionalCss: "",
});

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(import.meta.resolve("./header.vto"));
const templatePromise = env.load(pageTemplatePath);

const [processedCss, template] = await Promise.all([
  processedCssPromise,
  templatePromise,
]);

/**
 * Generates the header component.
 *
 * @returns {Promise<{ css: string; html: string }>} An object containing the CSS and HTML for the header.
 */
export const forgeHeader = async (): Promise<{
  css: string;
  html: string;
}> => {
  const classSuffix = getClassSuffix();
  const css = cssAddSuffix(processedCss, classSuffix);

  const html = (
    await template({
      classSuffix,
    })
  ).content;

  return {
    css,
    html,
  };
};
