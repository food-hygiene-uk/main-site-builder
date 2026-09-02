/**
 * Minifies all HTML files in the dist directory using htmlnano.
 */
import { walk } from "@std/fs";
import htmlnano from "htmlnano";

const DIST_DIR = "./dist";

/**
 * Minifies all HTML files in the dist directory using htmlnano with custom options.
 *
 * @returns Resolves when all HTML files have been minified.
 */
const minifyHtmlFiles = async (): Promise<void> => {
  // No custom options required for htmlnano; using defaults
  const options = {};
  const postHtmlOptions = {};
  // When preset is undefined, "safe" is used as default
  const preset = undefined;
  const concurrency = 4;
  const iterator = walk(DIST_DIR, {
    exts: [".html"],
    includeFiles: true,
    followSymlinks: false,
  });

  const workers: Promise<void>[] = [];
  let isDone = false;

  const processNext = async (): Promise<void> => {
    while (!isDone) {
      const { value: entry, done: iterDone } = await iterator.next();
      if (iterDone || !entry) {
        isDone = true;
        break;
      }
      const filePath = entry.path;
      try {
        const input = await Deno.readTextFile(filePath);
        const result = await htmlnano.process(
          input,
          options,
          preset,
          postHtmlOptions,
        );
        await Deno.writeTextFile(filePath, result.html);
        console.log(`Minified: ${filePath}`);
      } catch (error) {
        console.error(`Error minifying ${filePath}:`, error);
      }
    }
  };

  for (let index = 0; index < concurrency; index++) {
    workers.push(processNext());
  }
  await Promise.all(workers);
};

if (import.meta.main) {
  await minifyHtmlFiles();
}
