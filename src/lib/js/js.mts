import { fromFileUrl } from "@std/path";
import UglifyJS from "uglify-js";

const minifyOptions = {
  module: true,
  compress: {
    drop_console: true,
    dead_code: true,
    unused: true,
    drop_debugger: true,
  },
  output: {
    beautify: false,
    preamble: "/* Minified JavaScript */",
    comments: false,
  },
};

/**
 * Processes a JavaScript file by reading its content and minifying it.
 *
 * @param {{ path: string }} params - Parameters for processing JavaScript.
 * @param {string} params.path - The file path to the JavaScript file.
 * @returns {Promise<string>} A promise that resolves to the minified content of the JavaScript file as a string.
 */
export const processJsFile = async ({
  path,
}: {
  path: string;
}): Promise<string> => {
  const jsPath = fromFileUrl(path);
  const content = await globalThis.Deno.readTextFile(jsPath);
  const result = UglifyJS.minify(content, minifyOptions);
  if (result.error) {
    throw new Error(`Error minifying JavaScript: ${result.error}`);
  }

  return result.code;
};

/**
 * Adds a suffix to all class names in the provided JavaScript string.
 *
 * @param {string} js - The JavaScript content as a string.
 * @param {string} classSuffix - The suffix to append to class names.
 * @returns {string} The modified JavaScript with suffixed class names.
 */
export const jsAddSuffix = (js: string, classSuffix: string): string => {
  return js.replace(/__CLASS_SUFFIX__/g, classSuffix);
};
