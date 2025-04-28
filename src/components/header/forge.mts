import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { getClassSuffix } from "../../lib/template/template.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./styles.css"),
  additionalCss: "",
});

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

const pageTemplatePath = fromFileUrl(import.meta.resolve("./header.vto"));
const templatePromise = environment.load(pageTemplatePath);

const [processedCss, template] = await Promise.all([
  processedCssPromise,
  templatePromise,
]);

/**
 * Generates the header component.
 *
 * @returns An object containing the CSS and HTML for the header.
 */
export const forgeHeader = async (): Promise<{
  css: string;
  html: string;
}> => {
  const classSuffix = getClassSuffix();
  const css = cssAddSuffix(processedCss, classSuffix);

  const result = await template({
    classSuffix,
  });

  const html = result.content;

  return {
    css,
    html,
  };
};
