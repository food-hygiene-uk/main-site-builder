import { fromFileUrl } from "@std/path";

/**
 * Processes a JavaScript file by reading its content.
 *
 * @param {{ path: string }} params - Parameters for processing JavaScript.
 * @param {string} params.path - The file path to the JavaScript file.
 * @returns {Promise<string>} A promise that resolves to the content of the JavaScript file as a string.
 */
export const processJsFile = async (
  { path }: { path: string },
): Promise<string> => {
  const jsPath = fromFileUrl(path);
  return globalThis.Deno.readTextFile(jsPath);
};

/**
 * Adds a suffix to all class names in the provided JavaScript string.
 *
 * @param {string} js - The JavaScript content as a string.
 * @param {string} classSuffix - The suffix to append to class names.
 * @returns {string} The modified JavaScript with suffixed class names.
 */
export const jsAddSuffix = (
  js: string,
  classSuffix: string,
): string => {
  return js.replace(/__CLASS_SUFFIX__/g, classSuffix);
};
