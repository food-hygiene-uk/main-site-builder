import { fromFileUrl } from "@std/path";
import postcss from "postcss";
import cssnano from "cssnano";

/**
 * Processes a CSS file by applying transformations and injecting additional CSS.
 *
 * @param {{ path: string; additionalCss: string }} params - Parameters for processing CSS.
 * @param {string} params.path - The file path to the CSS file.
 * @param {string} params.additionalCss - Additional CSS to inject into the file.
 * @returns {Promise<string>} A promise that resolves to the processed CSS as a string.
 */
export const processCssFile = async (
  { path, additionalCss }: { path: string; additionalCss: string },
): Promise<string> => {
  const cssPath = fromFileUrl(path);
  const cssContent = await globalThis.Deno.readTextFile(cssPath);
  return (await postcss([cssnano]).process(cssContent, {
    from: undefined,
  })).css
    .replace(/\/\* __ADDITIONAL_CSS__ \*\//g, additionalCss);
};

/**
 * Adds a suffix to all CSS class names in the provided CSS string.
 *
 * @param {string} css - The CSS content as a string.
 * @param {string} classSuffix - The suffix to append to class names.
 * @returns {string} The modified CSS with suffixed class names.
 */
export const cssAddSuffix = (
  css: string,
  classSuffix: string,
): string => {
  return css.replace(/__CLASS_SUFFIX__/g, classSuffix);
};
