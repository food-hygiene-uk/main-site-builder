import { join } from "@std/path";
import { copy, emptyDir, ensureDir } from "@std/fs";
import { mapConcurrent } from "./generate-site/max-concurrent.ts";
import { outputEstablishments } from "./generate-site/output-establishments.ts";
import { fetchLocalAuthorityData } from "./generate-site/fetch-data.ts";
import { generateSitemap } from "./generate-site/output-sitemap.ts";
import { outputHomepage } from "./generate-site/output-homepage.ts";
import * as api from "./ratings-api/rest.ts";
import { outputRegionIndex } from "./generate-site/output-region-index.ts";

// Ensure build/dist directories exist
await ensureDir("build");
await emptyDir("dist");
await ensureDir("dist/e");
await ensureDir("dist/l");

// Copy images to the dist directory
await copy("assets/images/", "dist/images/");

const authoritiesResponse = await api.authorities();
const localAuthorities = authoritiesResponse.authorities;

console.time("fetchLocalAuthorityData");
const localAuthorityDataFiles = await fetchLocalAuthorityData();
console.timeEnd("fetchLocalAuthorityData");

const dataFiles: string[] = [];
for await (const path of localAuthorityDataFiles) {
  const fileInfo = await Deno.stat(path);
  const filename = path.split("/").pop() ?? "";
  // Only process the English data files (local authority names are the only difference)
  if (fileInfo.isFile && filename.endsWith("en-GB.json")) {
    dataFiles.push(join("build", filename));
  }
}

console.time("mapConcurrent");
await mapConcurrent(dataFiles, 10, async (filename) => {
  const timerName = `outputEstablishments-${filename}`;
  console.time(timerName);
  await outputEstablishments(filename);
  console.timeEnd(timerName);
});
console.timeEnd("mapConcurrent");

console.time("generateSitemap");
await generateSitemap();
console.timeEnd("generateSitemap");

console.time("outputHomepage");
await outputHomepage(localAuthorities);
console.timeEnd("outputHomepage");

console.time("outputRegionIndex");
await outputRegionIndex(localAuthorities);
console.timeEnd("outputRegionIndex");
