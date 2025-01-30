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
const localAuthorityDataFiles = await fetchLocalAuthorityData(localAuthorities);
console.timeEnd("fetchLocalAuthorityData");

console.time("mapConcurrent");
await mapConcurrent(localAuthorityDataFiles, 10, async (filename) => {
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
await outputHomepage();
console.timeEnd("outputHomepage");

console.time("outputRegionIndex");
await outputRegionIndex(localAuthorities);
console.timeEnd("outputRegionIndex");
