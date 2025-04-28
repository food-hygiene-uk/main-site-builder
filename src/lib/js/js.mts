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
 * @param params - Parameters for processing JavaScript.
 * @param params.path - The file path to the JavaScript file.
 * @returns A promise that resolves to the minified content of the JavaScript file as a string.
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
 * @param js - The JavaScript content as a string.
 * @param classSuffix - The suffix to append to class names.
 * @returns The modified JavaScript with suffixed class names.
 */
export const jsAddSuffix = (js: string, classSuffix: string): string => {
  return js.replaceAll("__CLASS_SUFFIX__", classSuffix);
};
