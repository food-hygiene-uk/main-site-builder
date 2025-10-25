
/**
 * Minifies all HTML files in the dist directory using htmlnano.
 */
import { walk } from "@std/fs";
import htmlnano from "htmlnano";

const DIST_DIR = "./dist";

/**
 * Minifies all HTML files in the dist directory using htmlnano with custom options.
 */
const minifyHtmlFiles = async () => {
  const options = {
    removeEmptyAttributes: false,
    collapseWhitespace: "conservative",
  };
  const postHtmlOptions = {
    lowerCaseTags: true,
    quoteAllAttributes: false,
  };
  // Preset can be undefined or omitted
  for await (const entry of walk(DIST_DIR, { exts: [".html"], includeFiles: true, followSymlinks: false })) {
    const filePath = entry.path;
    try {
      const input = await Deno.readTextFile(filePath);
      const result = await htmlnano.process(input, options, undefined, postHtmlOptions);
      await Deno.writeTextFile(filePath, result.html);
      console.log(`Minified: ${filePath}`);
    } catch (error) {
      console.error(`Error minifying ${filePath}:`, error);
    }
  }
};

if (import.meta.main) {
  minifyHtmlFiles();
}
